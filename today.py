import datetime
import os
import time
import hashlib
import math

from dateutil import relativedelta
import requests
from lxml import etree

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

# Fine-grained personal access token with All Repositories access:
# Account permissions: read:Followers, read:Starring, read:Watching
# Repository permissions: read:Commit statuses, read:Contents, read:Issues, read:Metadata, read:Pull Requests
HEADERS = {
    "authorization": "token "
    + os.environ.get("GITHUB_TOKEN", os.environ.get("ACCESS_TOKEN", ""))
}
USER_NAME = os.environ.get("USER_NAME", "swadhinbiswas")
QUERY_COUNT = {
    "user_getter": 0,
    "follower_getter": 0,
    "graph_repos_stars": 0,
    "recursive_loc": 0,
    "graph_commits": 0,
    "loc_query": 0,
    "streak_getter": 0,
    "language_getter": 0,
    "recent_repos_getter": 0,
}
MAX_RETRIES = 10


def daily_readme(birthday):
    """
    Returns the length of time since I was born
    e.g. 'XX years, XX months, XX days'
    """
    diff = relativedelta.relativedelta(datetime.datetime.today(), birthday)
    return "{} {}, {} {}, {} {}{}".format(
        diff.years,
        "year" + format_plural(diff.years),
        diff.months,
        "month" + format_plural(diff.months),
        diff.days,
        "day" + format_plural(diff.days),
        " 🎂" if (diff.months == 0 and diff.days == 0) else "",
    )


def format_plural(unit):
    """
    Returns 's' if unit != 1 else ''
    """
    return "s" if unit != 1 else ""


def simple_request(func_name, query, variables):
    """
    Returns a request, or raises an Exception if the response does not succeed.
    """
    for attempt in range(MAX_RETRIES):
        request = requests.post(
            "https://api.github.com/graphql",
            json={"query": query, "variables": variables},
            headers=HEADERS,
        )
        if request.status_code == 200:
            return request
        if request.status_code in [500, 502, 503, 504]:
            print(
                f"{func_name} failed with {request.status_code}. "
                f"Retrying in {2**attempt} seconds..."
            )
            time.sleep(2**attempt)
            continue
        raise Exception(
            func_name,
            " has failed with a",
            request.status_code,
            request.text,
            QUERY_COUNT,
        )
    raise Exception(
        func_name,
        " has failed with a",
        request.status_code,  # noqa: F821 – assigned in last loop iteration
        request.text,
        QUERY_COUNT,
    )


def graph_commits(start_date, end_date):
    """
    Uses GitHub's GraphQL v4 API to return my total commit count.
    """
    query_count("graph_commits")
    query = """
    query($start_date: DateTime!, $end_date: DateTime!, $login: String!) {
        user(login: $login) {
            contributionsCollection(from: $start_date, to: $end_date) {
                contributionCalendar {
                    totalContributions
                }
            }
        }
    }"""
    variables = {"start_date": start_date, "end_date": end_date, "login": USER_NAME}
    request = simple_request(graph_commits.__name__, query, variables)
    return int(
        request.json()["data"]["user"]["contributionsCollection"][
            "contributionCalendar"
        ]["totalContributions"]
    )


def graph_repos_stars(count_type, owner_affiliation, cursor=None, add_loc=0, del_loc=0):
    """
    Uses GitHub's GraphQL v4 API to return my total repository or star count.
    Raises ValueError for unknown count_type.
    """
    query_count("graph_repos_stars")
    query = """
    query ($owner_affiliation: [RepositoryAffiliation], $login: String!, $cursor: String) {
        user(login: $login) {
            repositories(first: 100, after: $cursor, ownerAffiliations: $owner_affiliation) {
                totalCount
                edges {
                    node {
                        ... on Repository {
                            nameWithOwner
                            stargazers {
                                totalCount
                            }
                        }
                    }
                }
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
    }"""
    variables = {
        "owner_affiliation": owner_affiliation,
        "login": USER_NAME,
        "cursor": cursor,
    }
    request = simple_request(graph_repos_stars.__name__, query, variables)
    if request.status_code == 200:
        if count_type == "repos":
            return request.json()["data"]["user"]["repositories"]["totalCount"]
        elif count_type == "stars":
            return stars_counter(
                request.json()["data"]["user"]["repositories"]["edges"]
            )
        else:
            # FIX: raise instead of silently returning None
            raise ValueError(f"graph_repos_stars: unknown count_type '{count_type}'")


def recursive_loc(
    owner,
    repo_name,
    data,
    cache_comment,
    addition_total=0,
    deletion_total=0,
    my_commits=0,
    cursor=None,
):
    """
    Uses GitHub's GraphQL v4 API and cursor pagination to fetch 100 commits at a time.
    """
    query_count("recursive_loc")
    query = """
    query ($repo_name: String!, $owner: String!, $cursor: String, $author_id: ID!) {
        repository(name: $repo_name, owner: $owner) {
            defaultBranchRef {
                target {
                    ... on Commit {
                        history(first: 100, after: $cursor, author: {id: $author_id}) {
                            totalCount
                            edges {
                                node {
                                    ... on Commit {
                                        committedDate
                                    }
                                    author {
                                        user {
                                            id
                                        }
                                    }
                                    deletions
                                    additions
                                }
                            }
                            pageInfo {
                                endCursor
                                hasNextPage
                            }
                        }
                    }
                }
            }
        }
    }"""
    variables = {
        "repo_name": repo_name,
        "owner": owner,
        "cursor": cursor,
        "author_id": OWNER_ID["id"],
    }
    request = None
    print(f"Fetching LOC for repo: {owner}/{repo_name} (cursor: {cursor})")
    for attempt in range(MAX_RETRIES):
        request = requests.post(
            "https://api.github.com/graphql",
            json={"query": query, "variables": variables},
            headers=HEADERS,
        )
        if request.status_code == 200:
            break
        if request.status_code in [500, 502, 503, 504]:
            print(
                f"recursive_loc failed with {request.status_code}. "
                f"Retrying in {2**attempt} seconds..."
            )
            time.sleep(2**attempt)
            continue
        break

    if request is None:
        force_close_file(data, cache_comment)
        raise Exception("recursive_loc() received no response after retries.")

    if request.status_code == 200:
        if request.json()["data"]["repository"]["defaultBranchRef"] is not None:
            return loc_counter_one_repo(
                owner,
                repo_name,
                data,
                cache_comment,
                request.json()["data"]["repository"]["defaultBranchRef"]["target"][
                    "history"
                ],
                addition_total,
                deletion_total,
                my_commits,
            )
        else:
            return 0, 0, 0  # FIX: return a consistent 3-tuple for empty repos

    force_close_file(data, cache_comment)
    if request.status_code == 403:
        raise Exception(
            "Too many requests in a short amount of time!\n"
            "You've hit the non-documented anti-abuse limit!"
        )
    raise Exception(
        "recursive_loc() has failed with a",
        request.status_code,
        request.text,
        QUERY_COUNT,
    )


def loc_counter_one_repo(
    owner,
    repo_name,
    data,
    cache_comment,
    history,
    addition_total,
    deletion_total,
    my_commits,
):
    """
    Recursively calls recursive_loc (GraphQL returns 100 commits max at a time).
    Only adds LOC values from commits authored by the account owner.
    """
    for node in history["edges"]:
        author_user = node["node"]["author"]["user"]
        # FIX: guard against None (bots / unlinked GitHub accounts)
        if author_user is not None and author_user.get("id") == OWNER_ID.get("id"):
            my_commits += 1
            addition_total += node["node"]["additions"]
            deletion_total += node["node"]["deletions"]

    if not history["edges"] or not history["pageInfo"]["hasNextPage"]:
        return addition_total, deletion_total, my_commits
    else:
        return recursive_loc(
            owner,
            repo_name,
            data,
            cache_comment,
            addition_total,
            deletion_total,
            my_commits,
            history["pageInfo"]["endCursor"],
        )


def loc_query(
    owner_affiliation,
    comment_size=0,
    force_cache=False,
    cursor=None,
    edges=None,  # FIX: mutable default argument replaced with None
):
    """
    Uses GitHub's GraphQL v4 API to query all repositories (per owner_affiliation).
    Queries 60 repos at a time to avoid 502 timeouts.
    Returns total lines of code across all repositories.
    """
    # FIX: initialise here, not in the signature
    if edges is None:
        edges = []

    query_count("loc_query")
    query = """
    query ($owner_affiliation: [RepositoryAffiliation], $login: String!, $cursor: String) {
        user(login: $login) {
            repositories(first: 60, after: $cursor, ownerAffiliations: $owner_affiliation) {
                edges {
                    node {
                        ... on Repository {
                            nameWithOwner
                            defaultBranchRef {
                                target {
                                    ... on Commit {
                                        history {
                                            totalCount
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                pageInfo {
                    endCursor
                    hasNextPage
                }
            }
        }
    }"""
    variables = {
        "owner_affiliation": owner_affiliation,
        "login": USER_NAME,
        "cursor": cursor,
    }
    request = simple_request(loc_query.__name__, query, variables)
    if request.json()["data"]["user"]["repositories"]["pageInfo"]["hasNextPage"]:
        edges += request.json()["data"]["user"]["repositories"]["edges"]
        return loc_query(
            owner_affiliation,
            comment_size,
            force_cache,
            request.json()["data"]["user"]["repositories"]["pageInfo"]["endCursor"],
            edges,
        )
    else:
        return cache_builder(
            edges + request.json()["data"]["user"]["repositories"]["edges"],
            comment_size,
            force_cache,
        )


def cache_builder(edges, comment_size, force_cache, loc_add=0, loc_del=0):
    """
    Checks each repository to see if it has been updated since last cache.
    If updated, runs recursive_loc to refresh the LOC count.
    """
    # Filter out None / malformed edges
    edges = [
        e
        for e in edges
        if e is not None
        and e.get("node") is not None
        and e["node"].get("nameWithOwner") is not None
    ]

    cached = True
    filename = os.path.join(
        "cache", hashlib.sha256(USER_NAME.encode("utf-8")).hexdigest() + ".txt"
    )  # FIX: use os.path.join for cross-platform paths
    try:
        with open(filename, "r") as f:
            data = f.readlines()
    except FileNotFoundError:
        data = []
        if comment_size > 0:
            for _ in range(comment_size):
                data.append(
                    "This line is a comment block. Write whatever you want here.\n"
                )
        os.makedirs("cache", exist_ok=True)
        with open(filename, "w") as f:
            f.writelines(data)

    if len(data) - comment_size != len(edges) or force_cache:
        cached = False
        flush_cache(edges, filename, comment_size)
        with open(filename, "r") as f:
            data = f.readlines()

    cache_comment = data[:comment_size]
    data = data[comment_size:]

    for index in range(len(edges)):
        repo_hash, commit_count, *__ = data[index].split()
        if (
            repo_hash
            == hashlib.sha256(
                edges[index]["node"]["nameWithOwner"].encode("utf-8")
            ).hexdigest()
        ):
            # FIX: guard against None defaultBranchRef before accessing nested keys
            default_branch = edges[index]["node"].get("defaultBranchRef")
            if default_branch is None:
                data[index] = repo_hash + " 0 0 0 0\n"
                continue
            try:
                current_commit_count = default_branch["target"]["history"]["totalCount"]
                if int(commit_count) != current_commit_count:
                    owner, repo_name = edges[index]["node"]["nameWithOwner"].split("/")
                    loc = recursive_loc(owner, repo_name, data, cache_comment)
                    data[index] = (
                        repo_hash
                        + " "
                        + str(current_commit_count)
                        + " "
                        + str(loc[2])
                        + " "
                        + str(loc[0])
                        + " "
                        + str(loc[1])
                        + "\n"
                    )
            except TypeError:
                data[index] = repo_hash + " 0 0 0 0\n"

    with open(filename, "w") as f:
        f.writelines(cache_comment)
        f.writelines(data)

    for line in data:
        loc = line.split()
        loc_add += int(loc[3])
        loc_del += int(loc[4])

    return [loc_add, loc_del, loc_add - loc_del, cached]


def flush_cache(edges, filename, comment_size):
    """
    Wipes the cache file (keeps comment block).
    Called when the number of repositories changes or file is first created.
    """
    with open(filename, "r") as f:
        data = []
        if comment_size > 0:
            data = f.readlines()[:comment_size]
    with open(filename, "w") as f:
        f.writelines(data)
        for node in edges:
            if (
                node is None
                or node.get("node") is None
                or node["node"].get("nameWithOwner") is None
            ):
                continue
            f.write(
                hashlib.sha256(
                    node["node"]["nameWithOwner"].encode("utf-8")
                ).hexdigest()
                + " 0 0 0 0\n"
            )


def force_close_file(data, cache_comment):
    """
    Saves partial data before a crash so progress isn't fully lost.
    """
    filename = os.path.join(
        "cache", hashlib.sha256(USER_NAME.encode("utf-8")).hexdigest() + ".txt"
    )  # FIX: os.path.join for consistency
    with open(filename, "w") as f:
        f.writelines(cache_comment)
        f.writelines(data)
    print(
        "There was an error while writing to the cache file. "
        f"The file {filename} has had the partial data saved and closed."
    )


def stars_counter(data):
    """
    Counts total stars across repositories owned by the user.
    """
    total_stars = 0
    for node in data:
        total_stars += node["node"]["stargazers"]["totalCount"]
    return total_stars


def svg_overwrite(
    filename,
    age_data,
    commit_data,
    star_data,
    repo_data,
    contrib_data,
    follower_data,
    loc_data,
    streak_data=None,
    lang_data=None,
    yearly_data=None,
    score_data=None,
    recent_repos=None,
):
    """
    Parses SVG files and updates elements with GitHub stats.
    """
    tree = etree.parse(filename)
    root = tree.getroot()

    find_and_replace(
        root,
        "repo_data",
        "{:,}".format(repo_data) if isinstance(repo_data, int) else str(repo_data),
    )
    find_and_replace(
        root,
        "star_data",
        "{:,}".format(star_data) if isinstance(star_data, int) else str(star_data),
    )
    find_and_replace(
        root,
        "commit_data",
        (
            "{:,}".format(commit_data)
            if isinstance(commit_data, int)
            else str(commit_data)
        ),
    )
    find_and_replace(
        root,
        "follower_data",
        (
            "{:,}".format(follower_data)
            if isinstance(follower_data, int)
            else str(follower_data)
        ),
    )
    # FIX: always coerce to str before assigning to SVG text element
    find_and_replace(
        root,
        "loc_data",
        str(loc_data[2]) if isinstance(loc_data, list) else str(loc_data),
    )
    find_and_replace(
        root,
        "loc_add",
        str(loc_data[0]) if isinstance(loc_data, list) else "...",
    )
    find_and_replace(
        root,
        "loc_del",
        str(loc_data[1]) if isinstance(loc_data, list) else "...",
    )

    # Convert age string to compact format
    age_str = str(age_data)
    cosmos_age = (
        age_str.replace(" years", " yrs")
        .replace(" year", " yr")
        .replace(" months", " mo")
        .replace(" month", " mo")
        .replace(" days", " d")
        .replace(" day", " d")
        .replace(", ", " · ")
        .replace(" 🎂", "")
    )
    find_and_replace(root, "age_data", cosmos_age)
    find_and_replace(
        root,
        "contrib_data",
        (
            "{:,}".format(contrib_data)
            if isinstance(contrib_data, int)
            else str(contrib_data)
        ),
    )
    find_and_replace(
        root,
        "star_planet",
        "{:,}".format(star_data) if isinstance(star_data, int) else str(star_data),
    )

    # Abbreviated LOC for planet display
    if isinstance(loc_data, list):
        try:
            net_loc = int(str(loc_data[2]).replace(",", ""))
            if net_loc >= 1_000_000:
                loc_abbrev = "{:.2f}M".format(net_loc / 1_000_000)
            elif net_loc >= 1_000:
                loc_abbrev = "{:.1f}K".format(net_loc / 1_000)
            else:
                loc_abbrev = str(net_loc)
        except (ValueError, IndexError):
            loc_abbrev = str(loc_data[2])
    else:
        loc_abbrev = str(loc_data)
    find_and_replace(root, "loc_planet", loc_abbrev)

    if streak_data is not None:
        find_and_replace(root, "streak_data", str(streak_data))

    if lang_data is not None:
        for i, (lang_name, pct) in enumerate(lang_data):
            find_and_replace(root, "lang_pct_{}".format(i), "{}%".format(pct))

    if yearly_data is not None:
        for year, count in yearly_data.items():
            find_and_replace(root, "year_{}".format(year), "{:,}".format(count))
        total_contribs = sum(yearly_data.values())
        find_and_replace(root, "total_contrib", "{:,}".format(total_contribs))
        ring_label = (
            "{:.1f}K".format(total_contribs / 1_000)
            if total_contribs >= 1_000
            else "{:,}".format(total_contribs)
        )
        find_and_replace(root, "ring_commits", ring_label)
        find_and_replace(
            root,
            "ring_stars",
            "{:,}".format(star_data) if isinstance(star_data, int) else str(star_data),
        )

    if score_data is not None:
        score_val, rank_val = score_data
        find_and_replace(root, "score_left", str(score_val))
        find_and_replace(root, "rank_left", rank_val)
        find_and_replace(root, "score_right", str(score_val))
        find_and_replace(root, "rank_right", rank_val)

    if recent_repos is not None:
        for i, (repo_name, repo_lang, repo_time) in enumerate(recent_repos[:4]):
            find_and_replace(root, "project_name_{}".format(i), repo_name)
            find_and_replace(root, "project_lang_{}".format(i), repo_lang)
            find_and_replace(root, "project_time_{}".format(i), repo_time)

    tree.write(filename, encoding="utf-8", xml_declaration=True)


def justify_format(root, element_id, new_text, length=0):
    """
    Updates element text and pads the preceding dot element to right-justify.
    """
    if isinstance(new_text, int):
        new_text = "{:,}".format(new_text)
    new_text = str(new_text)
    find_and_replace(root, element_id, new_text)
    just_len = max(0, length - len(new_text))
    if just_len <= 2:
        dot_map = {0: "", 1: " ", 2: ". "}
        dot_string = dot_map[just_len]
    else:
        dot_string = " " + ("." * just_len) + " "
    find_and_replace(root, f"{element_id}_dots", dot_string)


def find_and_replace(root, element_id, new_text):
    """
    Finds an SVG element by id and sets its text content.
    """
    element = root.find(f".//*[@id='{element_id}']")
    if element is not None:
        element.text = new_text


def commit_counter(comment_size):
    """
    Counts total commits from the cache file created by cache_builder.
    """
    total_commits = 0
    filename = os.path.join(
        "cache", hashlib.sha256(USER_NAME.encode("utf-8")).hexdigest() + ".txt"
    )
    with open(filename, "r") as f:
        data = f.readlines()
    data = data[comment_size:]
    for line in data:
        total_commits += int(line.split()[2])
    return total_commits


def contribution_getter(acc_date_str):
    """
    Returns (total_contributions, {year: count}) across all years since account creation.
    """
    acc_date = datetime.datetime.strptime(acc_date_str[:10], "%Y-%m-%d")
    today = datetime.datetime.today()
    total = 0
    yearly = {}
    year = acc_date.year
    while year <= today.year:
        start = max(acc_date, datetime.datetime(year, 1, 1))
        end = min(today, datetime.datetime(year, 12, 31, 23, 59, 59))
        if start <= end:
            count = graph_commits(
                start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                end.strftime("%Y-%m-%dT%H:%M:%SZ"),
            )
            yearly[year] = count
            total += count
        year += 1
    return total, yearly


def account_age(acc_date_str):
    """
    Returns the age of the GitHub account as a formatted string.
    e.g. '3 years, 8 months, 27 days'
    """
    acc_date = datetime.datetime.strptime(acc_date_str[:10], "%Y-%m-%d")
    diff = relativedelta.relativedelta(datetime.datetime.today(), acc_date)
    return "{} {}, {} {}, {} {}".format(
        diff.years,
        "year" + format_plural(diff.years),
        diff.months,
        "month" + format_plural(diff.months),
        diff.days,
        "day" + format_plural(diff.days),
    )


def streak_getter():
    """
    Returns the longest contribution streak over the last 365 days.
    """
    query_count("streak_getter")
    today = datetime.datetime.today()
    start = (today - datetime.timedelta(days=365)).strftime("%Y-%m-%dT00:00:00Z")
    end = today.strftime("%Y-%m-%dT23:59:59Z")
    query = """
    query($start_date: DateTime!, $end_date: DateTime!, $login: String!) {
        user(login: $login) {
            contributionsCollection(from: $start_date, to: $end_date) {
                contributionCalendar {
                    weeks {
                        contributionDays {
                            contributionCount
                            date
                        }
                    }
                }
            }
        }
    }"""
    variables = {"start_date": start, "end_date": end, "login": USER_NAME}
    request = simple_request(streak_getter.__name__, query, variables)
    weeks = request.json()["data"]["user"]["contributionsCollection"][
        "contributionCalendar"
    ]["weeks"]
    days = [day for week in weeks for day in week["contributionDays"]]
    day_map = {d["date"]: d["contributionCount"] for d in days}
    
    longest_streak = 0
    current_streak = 0
    sorted_dates = sorted(day_map.keys())
    
    for date_str in sorted_dates:
        if day_map[date_str] > 0:
            current_streak += 1
            if current_streak > longest_streak:
                longest_streak = current_streak
        else:
            current_streak = 0
            
    return longest_streak


def language_getter():
    """
    Returns top 5 languages by bytes across owned, non-forked repositories.
    Returns list of (language_name, percentage) tuples, descending by usage.
    """
    all_languages = {}
    cursor = None
    while True:
        query_count("language_getter")
        query = """
        query($login: String!, $cursor: String) {
            user(login: $login) {
                repositories(first: 100, after: $cursor, ownerAffiliations: OWNER, isFork: false) {
                    edges {
                        node {
                            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                                edges {
                                    size
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                    pageInfo {
                        endCursor
                        hasNextPage
                    }
                }
            }
        }"""
        variables = {"login": USER_NAME, "cursor": cursor}
        request = simple_request(language_getter.__name__, query, variables)
        data = request.json()["data"]["user"]["repositories"]
        for edge in data["edges"]:
            for lang_edge in edge["node"]["languages"]["edges"]:
                name = lang_edge["node"]["name"]
                size = lang_edge["size"]
                all_languages[name] = all_languages.get(name, 0) + size
        if data["pageInfo"]["hasNextPage"]:
            cursor = data["pageInfo"]["endCursor"]
        else:
            break
    total_size = sum(all_languages.values())
    if total_size == 0:
        return []
    sorted_langs = sorted(all_languages.items(), key=lambda x: x[1], reverse=True)
    return [(name, round(size / total_size * 100)) for name, size in sorted_langs[:5]]


def recent_repos_getter():
    """
    Returns the 4 most recently pushed owned, non-forked repositories as
    [(name, primary_language, time_ago), ...].
    """
    query_count("recent_repos_getter")
    query = """
    query($login: String!) {
        user(login: $login) {
            repositories(
                first: 4,
                ownerAffiliations: OWNER,
                isFork: false,
                orderBy: {field: PUSHED_AT, direction: DESC}
            ) {
                nodes {
                    name
                    pushedAt
                    primaryLanguage {
                        name
                    }
                }
            }
        }
    }"""
    variables = {"login": USER_NAME}
    request = simple_request(recent_repos_getter.__name__, query, variables)
    result = []
    if request.status_code == 200:
        nodes = request.json()["data"]["user"]["repositories"]["nodes"]
        now = datetime.datetime.now(datetime.timezone.utc)
        for node in nodes:
            name = node["name"]
            lang = node["primaryLanguage"]["name"] if node["primaryLanguage"] else "---"
            pushed = datetime.datetime.strptime(
                node["pushedAt"], "%Y-%m-%dT%H:%M:%SZ"
            ).replace(tzinfo=datetime.timezone.utc)
            delta = now - pushed
            days = delta.days
            if days == 0:
                hours = delta.seconds // 3600
                time_ago = "just now" if hours == 0 else "{}h ago".format(hours)
            elif days < 7:
                time_ago = "{}d ago".format(days)
            elif days < 30:
                time_ago = "{}w ago".format(days // 7)
            elif days < 365:
                time_ago = "{}mo ago".format(days // 30)
            else:
                time_ago = "{}y ago".format(days // 365)
            result.append((name, lang, time_ago))
    return result


def compute_score(commits, stars, repos, followers, loc_net):
    """
    Computes a developer score (0–100) and letter rank based on GitHub stats.
    Returns (score: int, rank: str).
    """
    commit_score = min(30, 30 * math.log10(max(commits, 1)) / math.log10(10000))
    star_score = min(25, 25 * math.log10(max(stars, 1)) / math.log10(5000))
    repo_score = min(10, 10 * math.log10(max(repos, 1)) / math.log10(200))
    follower_score = min(15, 15 * math.log10(max(followers, 1)) / math.log10(1000))
    loc_score = min(20, 20 * math.log10(max(loc_net, 1)) / math.log10(10_000_000))
    score = min(
        100,
        max(
            0, int(commit_score + star_score + repo_score + follower_score + loc_score)
        ),
    )
    if score >= 90:
        rank = "S+"
    elif score >= 80:
        rank = "A+"
    elif score >= 70:
        rank = "A"
    elif score >= 60:
        rank = "B+"
    elif score >= 50:
        rank = "B"
    elif score >= 40:
        rank = "C"
    else:
        rank = "D"
    return score, rank


def user_getter(username):
    """
    Returns the account ID dict and creation timestamp for the given username.
    """
    query_count("user_getter")
    query = """
    query($login: String!){
        user(login: $login) {
            id
            createdAt
        }
    }"""
    variables = {"login": username}
    request = simple_request(user_getter.__name__, query, variables)
    return (
        {"id": request.json()["data"]["user"]["id"]},
        request.json()["data"]["user"]["createdAt"],
    )


def follower_getter(username):
    """
    Returns the total follower count for the given username.
    """
    query_count("follower_getter")
    query = """
    query($login: String!){
        user(login: $login) {
            followers {
                totalCount
            }
        }
    }"""
    request = simple_request(follower_getter.__name__, query, {"login": username})
    return int(request.json()["data"]["user"]["followers"]["totalCount"])


def query_count(funct_id):
    """Increments the API call counter for the given function."""
    global QUERY_COUNT
    QUERY_COUNT[funct_id] += 1


def perf_counter(funct, *args):
    """
    Times a function call.
    Returns (result, elapsed_seconds).
    """
    start = time.perf_counter()
    funct_return = funct(*args)
    return funct_return, time.perf_counter() - start


def formatter(query_type, difference, funct_return=False, whitespace=0):
    """
    Prints a formatted timing line.
    Returns formatted result if whitespace > 0, else raw result.
    """
    print("{:<23}".format("   " + query_type + ":"), sep="", end="")
    if difference > 1:
        print("{:>12}".format("%.4f" % difference + " s "))
    else:
        print("{:>12}".format("%.4f" % (difference * 1000) + " ms"))
    if whitespace:
        return f"{'{:,}'.format(funct_return): <{whitespace}}"
    return funct_return


if __name__ == "__main__":
    print("Calculation times:")

    # Fetch account creation date and owner ID
    user_data, user_time = perf_counter(user_getter, USER_NAME)
    OWNER_ID, acc_date = user_data
    formatter("account data", user_time)

    age_data, age_time = perf_counter(account_age, acc_date)
    formatter("age calculation", age_time)

    total_loc, loc_time = perf_counter(
        loc_query, ["OWNER", "COLLABORATOR", "ORGANIZATION_MEMBER"], 7
    )
    formatter("LOC (cached)" if total_loc[-1] else "LOC (no cache)", loc_time)

    contrib_result, contrib_time = perf_counter(contribution_getter, acc_date)
    contrib_data, yearly_data = contrib_result
    formatter("contributions", contrib_time)

    commit_data = contrib_data

    star_data, star_time = perf_counter(graph_repos_stars, "stars", ["OWNER"])
    formatter("stars", star_time)  # FIX: was missing

    repo_data, repo_time = perf_counter(graph_repos_stars, "repos", ["OWNER"])
    formatter("repos", repo_time)  # FIX: was missing

    follower_data, follower_time = perf_counter(follower_getter, USER_NAME)
    formatter("followers", follower_time)  # FIX: was missing

    streak_data, streak_time = perf_counter(streak_getter)
    formatter("streak", streak_time)

    lang_data, lang_time = perf_counter(language_getter)
    formatter("languages", lang_time)

    recent_repos, recent_repos_time = perf_counter(recent_repos_getter)
    formatter("recent repos", recent_repos_time)

    for index in range(len(total_loc) - 1):
        total_loc[index] = "{:,}".format(total_loc[index])

    try:
        net_loc_val = (
            int(total_loc[2].replace(",", ""))
            if isinstance(total_loc[2], str)
            else total_loc[2]
        )
    except (ValueError, IndexError):
        net_loc_val = 0

    score_data = compute_score(
        commit_data, star_data, repo_data, follower_data, net_loc_val
    )

    common_args = dict(
        age_data=age_data,
        commit_data=commit_data,
        star_data=star_data,
        repo_data=repo_data,
        contrib_data=contrib_data,
        follower_data=follower_data,
        loc_data=total_loc[:-1],
    )
    svg_overwrite("dark_mode.svg", **common_args)
    svg_overwrite("light_mode.svg", **common_args)
    svg_overwrite(
        "cosmos.svg",
        **common_args,
        streak_data=streak_data,
        lang_data=lang_data,
        yearly_data=yearly_data,
        score_data=score_data,
        recent_repos=recent_repos,
    )

    # Push stats to database directly via Turso
    try:
        TURSO_DATABASE_URL = os.environ.get("TURSO_DATABASE_URL")
        TURSO_AUTH_TOKEN = os.environ.get("TURSO_AUTH_TOKEN")
        
        if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN:
            print("\n🚀 Pushing stats directly to database (Turso)...")
            
            stats_data = {
                "loc": total_loc[:-1],
                "stars": star_data,
                "repos": repo_data,
                "followers": follower_data,
                "commits": commit_data,
                "streak": streak_data,
                "languages": lang_data,
                "score": score_data[0],
                "rank": score_data[1],
                "age": age_data,
            }
            
            import json
            import time
            now = int(time.time() * 1000)
            
            requests_list = []
            for key, value in stats_data.items():
                cache_key = f"github_stat_{key}"
                json_val = json.dumps(value)
                requests_list.append({
                    "type": "execute",
                    "stmt": {
                        "sql": "INSERT INTO api_cache (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at",
                        "args": [
                            {"type": "text", "value": cache_key},
                            {"type": "text", "value": json_val},
                            {"type": "integer", "value": str(now)}
                        ]
                    }
                })
                
            requests_list.append({"type": "close"})
            
            url = TURSO_DATABASE_URL.replace("libsql://", "https://")
            endpoint = f"{url}/v2/pipeline"
            headers = {
                "Authorization": f"Bearer {TURSO_AUTH_TOKEN}",
                "Content-Type": "application/json"
            }
            payload = {"requests": requests_list}
            
            res = requests.post(endpoint, json=payload, headers=headers)
            
            if res.status_code == 200:
                print("  ✅ Database updated successfully!")
            else:
                print(f"  ❌ Failed to update database: {res.status_code} {res.text}")
        else:
            print("\n⚠️  TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not found, skipping database update.")
    except Exception as e:
        print(f"\n❌ Error pushing to database: {e}")

    # FIX: include star_time, repo_time, follower_time in total (were missing before)
    total_time = (
        user_time
        + age_time
        + loc_time
        + contrib_time
        + star_time
        + repo_time
        + follower_time
        + streak_time
        + lang_time
        + recent_repos_time
    )
    print(
        "\n{:<21}".format("Total function time:"),
        "{:>11}".format("%.4f" % total_time),
        " s",
        sep="",
    )
    print("Total GitHub GraphQL API calls:", "{:>3}".format(sum(QUERY_COUNT.values())))
    for funct_name, count in QUERY_COUNT.items():
        print("{:<28}".format("   " + funct_name + ":"), "{:>6}".format(count))
