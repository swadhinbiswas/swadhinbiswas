import datetime
import html
import json
import os
import re
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
    "today_contrib_getter": 0,
    "repo_loc_since": 0,
    "today_contrib_getter": 0,
    "visits_getter": 0,
    "top_repos_getter": 0,
    "rest_star_total": 0,
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


def rest_star_total():
    """
    Total stars across owned repositories via the REST API. Fine-grained
    personal access tokens are denied the GraphQL `stargazers` field, which
    nulls out whole repository nodes — REST repo metadata works instead.
    """
    query_count("rest_star_total")
    total = 0
    page = 1
    while True:
        request = requests.get(
            "https://api.github.com/user/repos",
            params={
                "affiliation": "owner",
                "visibility": "public",
                "per_page": 100,
                "page": page,
            },
            headers={**HEADERS, "Accept": "application/vnd.github+json"},
        )
        if request.status_code != 200:
            raise Exception(
                "rest_star_total() failed with",
                request.status_code,
                request.text,
            )
        batch = request.json()
        if not batch:
            break
        total += sum(int(repo["stargazers_count"]) for repo in batch)
        if len(batch) < 100:
            break
        page += 1
    return total


def graph_repos_stars(count_type, owner_affiliation, cursor=None, add_loc=0, del_loc=0):
    """
    Returns my total repository (GraphQL totalCount) or star (REST) count.
    Raises ValueError for unknown count_type.
    """
    if count_type == "stars":
        return rest_star_total()
    query_count("graph_repos_stars")
    query = """
    query ($owner_affiliation: [RepositoryAffiliation], $login: String!) {
        user(login: $login) {
            repositories(first: 1, ownerAffiliations: $owner_affiliation) {
                totalCount
            }
        }
    }"""
    variables = {
        "owner_affiliation": owner_affiliation,
        "login": USER_NAME,
    }
    request = simple_request(graph_repos_stars.__name__, query, variables)
    if request.status_code == 200:
        if count_type == "repos":
            return request.json()["data"]["user"]["repositories"]["totalCount"]
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
    # full list — the panel picks the head and force-includes rust/go
    return [(name, round(size / total_size * 100)) for name, size in sorted_langs]


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


# ---------------------------------------------------------------------------
# README generation — hero dashboard SVG + ASCII stats panel into readme.md
# ---------------------------------------------------------------------------

README_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "readme.md")
HERO_SVG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hero.svg")
HERO_SVG_URL = "https://raw.githubusercontent.com/{u}/{u}/main/hero.svg"
README_START_MARKER = "<!-- TODAY:START -->"
README_END_MARKER = "<!-- TODAY:END -->"
PANEL_WIDTH = 88

# Name shown in the hero banner
HERO_NAME = "SWADHIN"

# Phrases cycled by the hero typewriter animation
TYPING_PHRASES = [
    "mlops & data engineer",
    "python · spark · kubernetes",
    "pipeline automation",
    "open to eu relocation",
]

# Shorter display names for the languages panel
LANGUAGE_ALIASES = {
    "jupyter notebook": "jupyter",
    "vim script": "vimscript",
    "dockerfile": "docker",
}

# Compact language codes for the top-repositories rows
LANG_SHORT = {
    "typescript": "ts",
    "javascript": "js",
    "jupyter notebook": "jupyter",
    "python": "py",
    "rust": "rs",
}

# ---------------------------------------------------------------------------
# Projects grid — single source of truth for the "projects" section that sits
# below the auto-generated block in readme.md. To add a project by hand,
# append one tuple to the matching category; the repository link, alignment
# and layout are generated automatically on the next run:
#
#     ("repo-name", "short tagline")              -> links to github.com/<you>/repo-name
#     ("display Name", "tagline", "https://url")  -> custom link target
# ---------------------------------------------------------------------------
PROJECTS = {
    "TOOLS": [
        ("veet", "universal app uninstaller"),
        ("lsf", "ls with nerd-font icons"),
        ("fetchx", "neofetch rewritten in rust"),
        ("Ghost", "free & open coding tool"),
        ("ZenDownload", "download anything, one place"),
        ("vscode-android", "a real ide for android"),
        ("warren", "rootless cli runtime"),
    ],
    "DEVOPS": [
        ("OpencodeHub", "git platform w/ ci pipelines"),
        ("gvx", "the pnpm of python"),
        ("HiFiLinux", "audiophile audio for linux"),
    ],
    "DATA ENGINEERING": [
        ("air-traffic", "european flight data pipeline"),
        ("eurostream", "eu data streaming pipeline"),
    ],
    "BACKEND": [
        ("JustAPI", "zero-copy rust web framework"),
    ],
    "MACHINE-LEARNING": [
        ("Aurora", "modular reasoning architecture"),
        ("AegisVision", "multi-camera ai surveillance"),
        ("Ecoguard", "self-hosted llm inference gw"),
        ("opengrammar", "open-source grammarly alt"),
    ],
    "RESEARCH": [
        ("contexa", "versioned llm agent memory"),
        ("DOOMSDAYCS", "offline cs encyclopedia"),
        ("FAANG-Playbook", "1,400+ leetcode problems"),
    ],
    "OTHERS": [
        ("linuxy", "one-click appimage runner"),
        ("de-omarchy", "modern desktop, no omarchy"),
        ("Mervelas", "ai coding cli built on bun"),
        ("VidoLib", "lag-free media engine"),
        ("moonshell", "personal qml linux rice"),
    ],
}
PROJECTS_LEFT = ("DATA ENGINEERING", "DEVOPS", "BACKEND", "MACHINE-LEARNING")
PROJECTS_RIGHT = ("RESEARCH", "TOOLS", "OTHERS")
PROJECTS_START_MARKER = "<!-- PROJECTS:START -->"
PROJECTS_END_MARKER = "<!-- PROJECTS:END -->"
PROJ_COL_W = 48  # visible characters per column
PROJ_NAME_W = 15  # visible characters for the repo-name field

# Hero palette — fixed dark theme so the cards look identical in
# GitHub light and dark mode (matches the dashboard mockup).
COLORS = {
    "card": "#0d1117",
    "card_stroke": "#30363d",
    "panel": "#161b22",
    "text": "#e6edf3",
    "muted": "#8b949e",
    "blue": "#4493f8",
    "blue_light": "#58a6ff",
    "green": "#3fb950",
    "red": "#f85149",
    "yellow": "#e3b341",
}
MONO_FONT = "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace"


def _panel_line(content=""):
    """Returns one panel row, padding/truncating content to PANEL_WIDTH."""
    return "│" + content.ljust(PANEL_WIDTH)[:PANEL_WIDTH] + "│"


def _panel_divider(title=""):
    """Returns ├────┤ with an optional centered section title embedded."""
    if not title:
        return "├" + "─" * PANEL_WIDTH + "┤"
    label = " {} ".format(title)
    fill = max(0, PANEL_WIDTH - len(label))
    left = fill // 2
    return "├" + "─" * left + label + "─" * (fill - left) + "┤"


def _repo_url(name):
    """GitHub URL for one of this account's repositories."""
    return "https://github.com/{}/{}".format(USER_NAME, name)


def _panel_cell(key, value, width, key_html=None):
    """
    Left-aligned 'key ..... value' fragment padded to `width`. `key_html`
    swaps markup (e.g. an anchor) into the key slot — its visible length must
    match len(key). All text is HTML-escaped here so panel rows can be
    embedded in readme.md verbatim.
    """
    key, value = str(key), str(value)
    prefix_len = len(key) + 2  # " " around the key
    dots = width - prefix_len - len(value) - 1
    if dots < 1:
        dots = 1
    key_part = key_html if key_html is not None else html.escape(key)
    cell = " {} ".format(key_part) + "." * dots + " " + html.escape(value)
    return cell.ljust(width)[:width]


def _two_col(left_pair, right_pair):
    """
    Two key/value cells side by side filling one panel row. Each cell is one
    narrower than its half so values never sit flush against the border.
    """
    half = PANEL_WIDTH // 2 - 1
    left = _panel_cell(*left_pair, half)
    right = _panel_cell(*right_pair, half)
    return _panel_line(left + " " + right + " ")


def _bar(pct, width=18):
    """Renders a percentage as a █/░ bar."""
    filled = int(round(width * max(0, min(100, pct)) / 100))
    return "█" * filled + "░" * (width - filled)


def _abbrev_number(value):
    """1234567 -> '1.2M', 182345 -> '182k', 912 -> '912'."""
    try:
        n = int(str(value).replace(",", ""))
    except ValueError:
        return str(value)
    sign = "-" if n < 0 else ""
    n = abs(n)
    if n >= 1_000_000:
        return "{}{:.1f}M".format(sign, n / 1_000_000)
    if n >= 10_000:
        return "{}{}k".format(sign, n // 1_000)
    return "{}{:,}".format(sign, n)


def _compact_age(age_str):
    """'2 years, 3 months, 12 days' -> '2y 3mo 12d'."""
    match = re.match(
        r"(\d+) years?, (\d+) months?, (\d+) days?", str(age_str)
    )
    if not match:
        return str(age_str)
    y, m, d = match.groups()
    return "{}y {}mo {}d".format(int(y), int(m), int(d))


def _repo_loc_since(owner, repo_name, since_dt, max_pages=4):
    """
    Sums additions/deletions/commits authored by OWNER_ID on the default
    branch of owner/repo_name since since_dt. Bounded pagination.
    """
    query_count("repo_loc_since")
    query = """
    query ($owner: String!, $repo: String!, $author: ID!, $since: GitTimestamp!, $cursor: String) {
        repository(owner: $owner, name: $repo) {
            defaultBranchRef {
                target {
                    ... on Commit {
                        history(first: 100, after: $cursor, since: $since, author: {id: $author}) {
                            edges {
                                node {
                                    ... on Commit {
                                        additions
                                        deletions
                                    }
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
        "owner": owner,
        "repo": repo_name,
        "author": OWNER_ID["id"],
        "since": since_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "cursor": None,
    }
    added = deleted = commits = 0
    for _ in range(max_pages):
        request = simple_request("_repo_loc_since", query, variables)
        history = request.json()["data"]["repository"]["defaultBranchRef"]["target"][
            "history"
        ]
        for edge in history["edges"]:
            added += edge["node"]["additions"]
            deleted += edge["node"]["deletions"]
            commits += 1
        if not history["pageInfo"]["hasNextPage"]:
            break
        variables["cursor"] = history["pageInfo"]["endCursor"]
    return added, deleted, commits


def today_contrib_getter():
    """
    Returns today's (UTC) stats via GraphQL:
    {'commits', 'added', 'deleted', 'top_repo'} where top_repo is the repo
    with the most lines added today. Only touches repos with commits today.
    """
    now = datetime.datetime.utcnow()
    midnight = datetime.datetime(now.year, now.month, now.day)
    query_count("today_contrib_getter")
    query = """
    query($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
                totalCommitContributions
                commitContributionsByRepository {
                    repository {
                        nameWithOwner
                    }
                }
            }
        }
    }"""
    variables = {
        "login": USER_NAME,
        "from": midnight.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "to": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }
    request = simple_request(today_contrib_getter.__name__, query, variables)
    collection = request.json()["data"]["user"]["contributionsCollection"]
    commits_today = int(collection["totalCommitContributions"])

    added_total = deleted_total = 0
    top_repo = "---"
    top_added = 0
    for edge in collection["commitContributionsByRepository"]:
        owner, repo_name = edge["repository"]["nameWithOwner"].split("/")
        added, deleted, _count = _repo_loc_since(owner, repo_name, midnight)
        added_total += added
        deleted_total += deleted
        if added > top_added:
            top_added = added
            top_repo = repo_name
    return {
        "commits": commits_today,
        "added": added_total,
        "deleted": deleted_total,
        "top_repo": top_repo,
    }


def visits_getter():
    """
    Reads the profile-views count by parsing the komarev counter SVG — the
    same visit URL embedded in the README — and records a daily snapshot in
    data/visits_history.json (last 60 days) used for the sparkline.
    Returns (count, daily_deltas_oldest_first).
    """
    request = requests.get(
        "https://komarev.com/ghpvc/?username={}".format(USER_NAME),
        headers={"User-Agent": "github-readme-today.py"},
        timeout=30,
    )
    if request.status_code != 200:
        raise Exception("visits_getter() failed with", request.status_code)
    matches = re.findall(r"<text[^>]*>([0-9,]+)</text>", request.text)
    if not matches:
        raise Exception("visits_getter(): no view count found in counter SVG")
    count = int(matches[-1].replace(",", ""))

    history_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "data", "visits_history.json"
    )
    history = {}
    if os.path.exists(history_path):
        try:
            with open(history_path, "r") as f:
                history = json.load(f)
        except (ValueError, OSError):
            history = {}
    today_key = datetime.date.today().isoformat()
    history[today_key] = max(count, int(history.get(today_key, 0) or 0))
    trimmed = dict(sorted(history.items())[-60:])
    os.makedirs(os.path.dirname(history_path), exist_ok=True)
    with open(history_path, "w") as f:
        json.dump(trimmed, f, indent=1, sort_keys=True)

    values = [int(v) for v in trimmed.values()]
    deltas = [values[0]] + [b - a for a, b in zip(values, values[1:])]
    return count, deltas[-30:]


def visits_fallback():
    """
    Best-effort count from the local history file when the counter URL is
    unreachable, so a komarev hiccup never breaks the README build.
    """
    history_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "data", "visits_history.json"
    )
    try:
        with open(history_path, "r") as f:
            history = json.load(f)
        pairs = sorted(history.items())[-60:]
        if pairs:
            values = [int(v) for _d, v in pairs]
            deltas = [values[0]] + [b - a for a, b in zip(values, values[1:])]
            return values[-1], deltas[-30:]
    except (OSError, ValueError):
        pass
    return 0, [0, 0]


def top_repos_getter(limit=5):
    """
    Returns the top `limit` owned public repositories by stars as
    [(name, language, stars), ...] via the REST search API — the GraphQL
    `stargazers` field is off-limits to fine-grained tokens.
    """
    request = requests.get(
        "https://api.github.com/search/repositories",
        params={
            "q": "user:{} fork:false".format(USER_NAME),
            "sort": "stars",
            "order": "desc",
            "per_page": limit,
        },
        headers={**HEADERS, "Accept": "application/vnd.github+json"},
    )
    if request.status_code != 200:
        raise Exception(
            "top_repos_getter() failed with", request.status_code, request.text
        )
    items = request.json().get("items", [])[:limit]
    return [
        (
            item["name"],
            (item.get("language") or "-").lower(),
            int(item["stargazers_count"]),
        )
        for item in items
        # keep the README meta-repository out of the leaderboard
        if item["name"].lower() != USER_NAME.lower()
    ][:limit]


def _language_rows(lang_data, limit=5, ensure=("rust", "go")):
    """
    Top `limit` languages plus any `ensure` languages found further down —
    rust and go belong on the board even when a few huge python/typescript
    repositories dominate the byte count.
    """
    rows = list(lang_data[:limit])
    present = {name.lower() for name, _pct in rows}
    for name, pct in lang_data[limit:]:
        if name.lower() in ensure and name.lower() not in present:
            rows.append((name, pct))
            present.add(name.lower())
    return rows


def render_stats_panel(
    lang_data,
    top_repos,
    contrib_data,
    star_data,
    repo_data,
    follower_data,
    loc_data,
    streak_data,
    score_data,
    age_data,
):
    """
    Builds the ASCII stats panel (languages / top repositories / all time)
    that sits below the hero SVG. Every glyph is single-width so alignment
    holds in GitHub code blocks.
    """
    lines = ["╭" + "─" * PANEL_WIDTH + "╮"]

    lines.append(_panel_divider("languages"))
    for name, pct in _language_rows(lang_data):
        display_name = LANGUAGE_ALIASES.get(name.lower(), name.lower())[:16]
        lines.append(
            _panel_line(
                " {:<16} {} {:>3}%".format(
                    html.escape(display_name), _bar(pct, 30), pct
                )
            )
        )

    lines.append(_panel_divider("top repositories"))
    if top_repos:
        for name, lang, stars in top_repos:
            display_name = name[:20]
            display_lang = LANG_SHORT.get(lang.lower(), lang.lower())[:8]
            anchor = '<a href="{u}">{n}</a>'.format(
                u=html.escape(_repo_url(name), quote=True),
                n=html.escape(display_name),
            )
            lines.append(
                _panel_line(
                    _panel_cell(
                        display_name,
                        "{} {:>5} ★".format(display_lang, stars),
                        PANEL_WIDTH - 1,
                        key_html=anchor,
                    )
                    + " "
                )
            )
    else:
        lines.append(_panel_line(" (no public repositories)"))

    net_lines = _abbrev_number(loc_data[2])
    lines.append(_panel_divider("all time"))
    lines.append(
        _two_col(
            ("contributions", "{:,}".format(contrib_data)),
            ("net lines", "+" + net_lines),
        )
    )
    lines.append(
        _two_col(("stars", star_data), ("public repos", repo_data))
    )
    lines.append(
        _two_col(
            ("followers", follower_data),
            ("longest streak", "{} days".format(streak_data)),
        )
    )
    lines.append(
        _two_col(
            ("dev score", "{}/100 · {}".format(score_data[0], score_data[1])),
            ("account age", _compact_age(age_data)),
        )
    )
    lines.append(_panel_line())
    lines.append(
        _panel_line(
            "auto-generated · {} · data: github api".format(
                datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
            ).center(PANEL_WIDTH).rstrip()
        )
    )
    lines.append("╰" + "─" * PANEL_WIDTH + "╯")
    return "\n".join(lines)


def _project_url(entry):
    """Link target for a PROJECTS entry — custom third element wins."""
    if len(entry) > 2 and entry[2]:
        return entry[2]
    return _repo_url(entry[0])


def _project_cell(entry):
    """
    One 'name  tagline' cell of raw HTML whose visible glyphs occupy exactly
    PROJ_COL_W columns. Only the tagline is ever truncated, never the link.
    """
    name, tagline = str(entry[0]), str(entry[1])
    nm = name[: PROJ_NAME_W - 1]
    anchor = '<a href="{u}">{n}</a>'.format(
        u=html.escape(_project_url(entry), quote=True), n=html.escape(nm)
    )
    tag_room = PROJ_COL_W - 2 - PROJ_NAME_W
    tag = html.escape(tagline)[:tag_room].rstrip()
    used = 2 + PROJ_NAME_W + len(tag)
    return "  {}{}{}".format(anchor, " " * (PROJ_NAME_W - len(nm)), tag) + " " * (
        PROJ_COL_W - used
    )


def _project_column(category_names):
    """Stacks categories into tagged cells: ('header'|'entry'|'blank', payload)."""
    cells = []
    for category in category_names:
        if category not in PROJECTS:
            continue
        if cells:
            cells.append(("blank", ""))
        cells.append(("header", category))
        for entry in PROJECTS[category]:
            cells.append(("entry", entry))
    return cells


def render_projects_panel():
    """
    Builds the two-column linked projects grid spliced between the PROJECTS
    markers in readme.md. Every repository name is a hyperlink; columns are
    filled in PROJECTS_LEFT then PROJECTS_RIGHT order and padded to equal
    height so the grid stays a perfect rectangle.
    """
    left = _project_column(PROJECTS_LEFT)
    right = _project_column(PROJECTS_RIGHT)
    height = max(len(left), len(right))
    left += [("blank", "")] * (height - len(left))
    right += [("blank", "")] * (height - len(right))

    def render(cell):
        kind, payload = cell
        if kind == "entry":
            return _project_cell(payload)
        if kind == "header":
            return html.escape(payload)[:PROJ_COL_W].ljust(PROJ_COL_W)
        return " " * PROJ_COL_W

    return "\n".join(render(l) + render(r) for l, r in zip(left, right)).rstrip()


def _xml_escape(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _icon(kind, x, y, color, scale=1.0, filled=False):
    """Minimal vector icon set used across the hero card."""
    paths = {
        "branch": (
            '<circle cx="0" cy="-5.2" r="2"/><circle cx="0" cy="5.2" r="2"/>'
            '<circle cx="6.8" cy="0" r="2"/><path d="M0 -3.2 L0 3.2 M0 0 C4.8 0 6.8 -1.4 6.8 -2"/>'
        ),
        "repo": (
            '<rect x="-5.5" y="-7" width="11" height="14" rx="2"/>'
            '<path d="M-2 -7 v5.5 l2 -1.6 2 1.6 v-5.5"/>'
        ),
        "calendar": (
            '<rect x="-6.5" y="-5" width="13" height="11.5" rx="2"/>'
            '<path d="M-3 -7.2 v3 M3 -7.2 v3 M-6.5 -1.2 h13"/>'
        ),
        "person": (
            '<circle cx="0" cy="-3.6" r="3.3"/><path d="M-6.4 6.8 C-6.4 2.6 6.4 2.6 6.4 6.8"/>'
        ),
        "star": (
            '<path d="M0 -7 L2 -2.3 7 -1.9 3.2 1.4 4.3 6.3 0 3.7 -4.3 6.3 -3.2 1.4 -7 -1.9 -2 -2.3 Z"/>'
        ),
    }
    fill = color if filled else "none"
    stroke = "none" if filled else color
    return (
        '<g transform="translate({} {}) scale({})" fill="{}" stroke="{}" '
        'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">{}</g>'
    ).format(x, y, scale, fill, stroke, paths[kind])


def _typewriter_elements(x, y, char_width=9.0):
    """
    Builds the SMIL typewriter for the tagline: each phrase gets a clip-path
    whose width animates 0 -> full (monospace, so width == typed characters),
    a matching opacity envelope, and a blinking block cursor at the text head.
    Returns (svg_fragment, total_duration_seconds).
    """
    type_t, hold_t, gap_t = 1.4, 1.3, 0.3
    phrase_dur = type_t + hold_t + gap_t
    total = phrase_dur * len(TYPING_PHRASES)
    parts = []
    for index, phrase in enumerate(TYPING_PHRASES):
        t0 = index * phrase_dur
        t1 = t0 + type_t
        t2 = t0 + type_t + hold_t
        t3 = t2 + 0.15
        width = round(len(phrase) * char_width)
        key_times = "0;{:.4f};{:.4f};{:.4f};{:.4f};1".format(
            t0 / total, t1 / total, t2 / total, t3 / total
        )
        parts.append(
            '<clipPath id="type-clip-{i}"><rect x="{x}" y="{y}" width="0" height="26">'
            '<animate attributeName="width" values="0;0;{w};{w};0;0" keyTimes="{kt}" '
            'dur="{total}s" repeatCount="indefinite"/></rect></clipPath>'.format(
                i=index, x=x, y=y - 17, w=width, kt=key_times, total=total
            )
        )
        parts.append(
            '<text x="{x}" y="{y}" font-family="{font}" font-size="15" fill="{fill}" '
            'textLength="{w}" lengthAdjust="spacingAndGlyphs" clip-path="url(#type-clip-{i})" opacity="0">'
            '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="{kt}" '
            'dur="{total}s" repeatCount="indefinite"/>{text}</text>'.format(
                x=x, y=y, font=MONO_FONT, fill=COLORS["muted"], w=width,
                i=index, kt=key_times, total=total, text=_xml_escape(phrase),
            )
        )
        # block cursor, visible (and blinking) only during its phrase's slot
        stops = []
        if t0 > 0:
            stops.append((0.0, 0))
            stops.append((t0, 1))
        else:
            stops.append((0.0, 1))
        clock, visible = t0 + 0.35, 0
        while clock < t3:
            stops.append((clock, visible))
            visible = 1 - visible
            clock += 0.35
        stops.append((t3, 0))
        stops.append((total, 0))
        cleaned = [stops[0]]
        for stop in stops[1:]:
            if stop[0] > cleaned[-1][0]:
                cleaned.append(stop)
        parts.append(
            '<rect x="{x}" y="{y}" width="9" height="17" fill="{fill}" opacity="0">'
            '<animate attributeName="opacity" values="{vals}" keyTimes="{kt}" '
            'dur="{total}s" repeatCount="indefinite"/></rect>'.format(
                x=x + width, y=y - 13, fill=COLORS["blue_light"],
                vals=";".join(str(v) for _t, v in cleaned),
                kt=";".join("{:.4f}".format(t / total) for t, _v in cleaned),
                total=total,
            )
        )
    return "\n".join(parts), total


def _sparkline_paths(deltas, x, y, w, h):
    """
    Smooth line+area paths for the visits sparkline; daily deltas normalized
    into the box.
    """
    values = list(deltas) if deltas else [0, 0]
    if len(values) == 1:
        values = values * 2
    lo, hi = min(values), max(values)
    span = hi - lo
    count = len(values)
    points = []
    for i, v in enumerate(values):
        if span == 0:  # flat history: ride the mid-line, not the floor
            py = y + h / 2
        else:
            py = y + h - 3 - (v - lo) / span * (h - 6)
        points.append((x + i * w / (count - 1), py))
    line = "M {:.1f} {:.1f}".format(points[0][0], points[0][1])
    for i in range(1, count):
        mid_x = (points[i - 1][0] + points[i][0]) / 2
        mid_y = (points[i - 1][1] + points[i][1]) / 2
        line += " Q {:.1f} {:.1f} {:.1f} {:.1f}".format(
            points[i - 1][0], points[i - 1][1], mid_x, mid_y
        )
    line += " T {:.1f} {:.1f}".format(points[-1][0], points[-1][1])
    area = "{} L {:.1f} {:.1f} L {:.1f} {:.1f} Z".format(
        line, points[-1][0], y + h, points[0][0], y + h
    )
    return line, area


def generate_hero_svg(
    today_stats, visit_count, visit_deltas, follower_data, star_data, animate=True
):
    """
    Renders the hero dashboard (dark cards) as a standalone SVG:
    left — dotted-outline name, typewriter tagline, today's commit boxes;
    right — total visits with sparkline, followers, stars.
    Animation is pure SMIL so it runs inside GitHub's <img> sandbox.
    """
    c = COLORS
    now = datetime.datetime.now()
    date_label = "today · {}, {} {}".format(
        now.strftime("%A").lower(), now.strftime("%b").lower(), now.strftime("%d %Y")
    )

    svg_w, svg_h = 1140, 300
    left = {"x": 8, "y": 8, "w": 724, "h": 284}
    right = {"x": 748, "y": 8, "w": 384, "h": 284}
    left_cx = left["x"] + left["w"] / 2
    right_cx = right["x"] + right["w"] / 2

    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" '
        'viewBox="0 0 {w} {h}" role="img" aria-label="Swadhin Biswas — live GitHub dashboard">'.format(
            w=svg_w, h=svg_h
        ),
        "<defs>"
        '<linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">'
        '<stop offset="0" stop-color="{blue}" stop-opacity="0.35"/>'
        '<stop offset="1" stop-color="{blue}" stop-opacity="0"/>'
        "</linearGradient></defs>".format(blue=c["blue"]),
    ]
    for card in (left, right):
        parts.append(
            '<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" '
            'fill="{fill}" stroke="{stroke}" stroke-width="1"/>'.format(
                fill=c["card"], stroke=c["card_stroke"], **card
            )
        )

    # ---- left card: dotted-outline name ------------------------------------
    parts.append(
        '<text x="{x}" y="80" text-anchor="middle" font-family="{font}" '
        'font-size="58" font-weight="bold" letter-spacing="10" fill="none" '
        'stroke="{stroke}" stroke-width="1.1" stroke-dasharray="4 3.2">{name}</text>'.format(
            x=left_cx, font=MONO_FONT, stroke=c["text"], name=_xml_escape(HERO_NAME)
        )
    )

    # ---- left card: typewriter tagline -------------------------------------
    max_phrase_w = max(len(p) for p in TYPING_PHRASES) * 9.0
    type_x = left_cx - max_phrase_w / 2
    if animate:
        typewriter, _total = _typewriter_elements(type_x, 126)
        parts.append(typewriter)
    else:
        parts.append(
            '<text x="{x}" y="126" text-anchor="middle" font-family="{font}" '
            'font-size="15" fill="{fill}">{t}</text>'.format(
                x=left_cx, font=MONO_FONT, fill=c["muted"],
                t=_xml_escape(TYPING_PHRASES[0]),
            )
        )

    # ---- left card: date row ------------------------------------------------
    date_w = len(date_label) * 7.8
    line_y = 158
    gap = date_w / 2 + 26
    for a, b in (
        (left["x"] + 36, left_cx - gap),
        (left_cx + gap, left["x"] + left["w"] - 36),
    ):
        parts.append(
            '<line x1="{a}" y1="{y}" x2="{b}" y2="{y}" stroke="{s}" stroke-width="1"/>'.format(
                a=a, y=line_y, b=b, s=c["card_stroke"]
            )
        )
    parts.append(_icon("calendar", left_cx - date_w / 2 - 18, line_y - 4, c["muted"], 0.9))
    parts.append(
        '<text x="{x}" y="{y}" text-anchor="middle" font-family="{font}" '
        'font-size="13" fill="{fill}">{t}</text>'.format(
            x=left_cx, y=line_y + 4, font=MONO_FONT, fill=c["muted"],
            t=_xml_escape(date_label),
        )
    )

    # ---- left card: today boxes ---------------------------------------------
    box_y, box_h = 178, 96
    box_w = (left["w"] - 72 - 16) // 2
    boxes = [
        {
            "x": left["x"] + 36,
            "icon": "branch", "icon_color": c["green"],
            "label": "commits", "value": str(today_stats["commits"]),
            "side_label": "added",
            "side_value": "+" + _abbrev_number(today_stats["added"]),
            "side_color": c["green"],
        },
        {
            "x": left["x"] + 36 + box_w + 16,
            "icon": "repo", "icon_color": c["blue_light"],
            "label": "top repo",
            "value": "—" if today_stats["top_repo"] == "---" else today_stats["top_repo"][:12],
            "side_label": "removed",
            "side_value": "-" + _abbrev_number(today_stats["deleted"]),
            "side_color": c["red"],
        },
    ]
    for box in boxes:
        parts.append(
            '<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" '
            'fill="{fill}" stroke="{stroke}" stroke-width="1"/>'.format(
                x=box["x"], y=box_y, w=box_w, h=box_h,
                fill=c["panel"], stroke=c["card_stroke"],
            )
        )
        parts.append(_icon(box["icon"], box["x"] + 28, box_y + 30, box["icon_color"], 1.15))
        parts.append(
            '<text x="{x}" y="{y}" font-family="{font}" font-size="12.5" fill="{fill}">{t}</text>'.format(
                x=box["x"] + 50, y=box_y + 34, font=MONO_FONT, fill=c["muted"],
                t=_xml_escape(box["label"]),
            )
        )
        parts.append(
            '<text x="{x}" y="{y}" font-family="{font}" font-size="{size}" '
            'font-weight="bold" fill="{fill}">{t}</text>'.format(
                x=box["x"] + 50, y=box_y + 72, font=MONO_FONT,
                size=22 if box["label"] == "commits" else 17,
                fill=c["text"], t=_xml_escape(str(box["value"])),
            )
        )
        parts.append(
            '<text x="{x}" y="{y}" text-anchor="end" font-family="{font}" '
            'font-size="12.5" fill="{fill}">{t}</text>'.format(
                x=box["x"] + box_w - 24, y=box_y + 34, font=MONO_FONT,
                fill=c["muted"], t=_xml_escape(box["side_label"]),
            )
        )
        parts.append(
            '<text x="{x}" y="{y}" text-anchor="end" font-family="{font}" '
            'font-size="19" font-weight="bold" fill="{fill}">{t}</text>'.format(
                x=box["x"] + box_w - 24, y=box_y + 72, font=MONO_FONT,
                fill=box["side_color"], t=_xml_escape(box["side_value"]),
            )
        )

    # ---- right card: visits ---------------------------------------------------
    parts.append(
        '<text x="{x}" y="48" text-anchor="middle" font-family="{font}" '
        'font-size="13" letter-spacing="4" fill="{fill}">TOTAL VISITS</text>'.format(
            x=right_cx, font=MONO_FONT, fill=c["muted"]
        )
    )
    parts.append(
        '<text x="{x}" y="98" text-anchor="middle" font-family="{font}" '
        'font-size="42" font-weight="bold" fill="{fill}">{t}</text>'.format(
            x=right_cx, font=MONO_FONT, fill=c["blue"], t="{:,}".format(visit_count)
        )
    )
    line_path, area_path = _sparkline_paths(
        visit_deltas, right["x"] + 26, 112, right["w"] - 52, 56
    )
    parts.append('<path d="{}" fill="url(#spark-fill)" stroke="none"/>'.format(area_path))
    parts.append(
        '<path d="{}" fill="none" stroke="{}" stroke-width="2" stroke-linecap="round"/>'.format(
            line_path, c["blue_light"]
        )
    )
    parts.append(
        '<line x1="{a}" y1="190" x2="{b}" y2="190" stroke="{s}" stroke-width="1"/>'.format(
            a=right["x"] + 26, b=right["x"] + right["w"] - 26, s=c["card_stroke"]
        )
    )
    for kind, label, value, color, filled, row_y in (
        ("person", "FOLLOWERS", follower_data, c["muted"], False, 226),
        ("star", "STARS", star_data, c["yellow"], True, 264),
    ):
        parts.append(_icon(kind, right["x"] + 36, row_y - 5, color, 1.0, filled=filled))
        parts.append(
            '<text x="{x}" y="{y}" font-family="{font}" font-size="13" '
            'letter-spacing="2.5" fill="{fill}">{t}</text>'.format(
                x=right["x"] + 56, y=row_y, font=MONO_FONT, fill=c["muted"], t=label
            )
        )
        parts.append(
            '<text x="{x}" y="{y}" text-anchor="end" font-family="{font}" '
            'font-size="18" font-weight="bold" fill="{fill}">{t}</text>'.format(
                x=right["x"] + right["w"] - 28, y=row_y, font=MONO_FONT,
                fill=c["text"], t="{:,}".format(value),
            )
        )

    parts.append("</svg>")
    return "\n".join(parts)


def update_readme_section(start_marker, end_marker, inner_html):
    """Replaces everything between two HTML comment markers in readme.md."""
    with open(README_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    pattern = re.compile(
        re.escape(start_marker) + r".*?" + re.escape(end_marker),
        re.DOTALL,
    )
    if not pattern.search(content):
        raise RuntimeError(
            "readme.md is missing the {} / {} markers".format(start_marker, end_marker)
        )
    replacement = "{}\n{}\n{}".format(start_marker, inner_html, end_marker)
    content = pattern.sub(lambda _m: replacement, content)
    with open(README_PATH, "w", encoding="utf-8") as f:
        f.write(content)


def update_readme(block_html):
    """Splices the auto-generated stats block between the TODAY markers."""
    update_readme_section(README_START_MARKER, README_END_MARKER, block_html)


def rebuild_readme(
    contrib_data,
    star_data,
    repo_data,
    follower_data,
    loc_data,
    streak_data,
    lang_data,
    score_data,
    age_data,
):
    """
    Regenerates the README block between the markers: the animated hero SVG
    on top and the borderless ASCII stats panel below it. Projects live in
    readme.md outside this block so they can be edited by hand.
    """
    today_stats = today_contrib_getter()

    try:
        visit_count, visit_deltas = visits_getter()
    except Exception as error:
        print("⚠️  visit counter unavailable ({}), using history".format(error))
        visit_count, visit_deltas = visits_fallback()

    top_repos = top_repos_getter()

    # hero dashboard image (dark cards, SMIL typewriter)
    hero_svg = generate_hero_svg(
        today_stats, visit_count, visit_deltas, follower_data, star_data
    )
    with open(HERO_SVG_PATH, "w", encoding="utf-8") as handle:
        handle.write(hero_svg)

    # borderless ASCII stats panel under the hero
    panel = render_stats_panel(
        lang_data,
        top_repos,
        contrib_data,
        star_data,
        repo_data,
        follower_data,
        loc_data,
        streak_data,
        score_data,
        age_data,
    )

    block_html = (
        '<p align="center">\n'
        '<img src="{}" width="100%" alt="Swadhin Biswas — live GitHub dashboard '
        '(animated)"/>'.format(HERO_SVG_URL.format(u=USER_NAME))
        + "\n</p>\n\n<pre>\n"
        + panel  # already HTML-escaped at the source (anchors stay clickable)
        + "\n</pre>\n\n"
        + "<!-- invisible pixel: keeps the komarev counter incrementing from "
        'real profile views -->\n<img src="https://komarev.com/ghpvc/'
        '?username={}&label=%20&color=0e75b6" alt="" width="1" height="1"/>\n'.format(
            USER_NAME
        )
    )
    update_readme(block_html)

    # linked projects grid — single source of truth: PROJECTS at the top
    try:
        update_readme_section(
            PROJECTS_START_MARKER,
            PROJECTS_END_MARKER,
            "<pre>\n" + render_projects_panel() + "\n</pre>",
        )
        print("projects grid regenerated ({} repositories linked)".format(
            sum(len(repos) for repos in PROJECTS.values())
        ))
    except RuntimeError as error:
        print("⚠️  projects grid skipped: {}".format(error))

    print("readme.md regenerated (hero.svg written, {} panel lines)".format(
        panel.count("\n") + 1
    ))


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

    # Regenerate readme.md (ASCII dashboard + project grid)
    try:
        readme_start = time.perf_counter()
        rebuild_readme(
            contrib_data=contrib_data,
            star_data=star_data,
            repo_data=repo_data,
            follower_data=follower_data,
            loc_data=total_loc[:-1],
            streak_data=streak_data,
            lang_data=lang_data,
            score_data=score_data,
            age_data=age_data,
        )
        formatter("readme rebuild", time.perf_counter() - readme_start)
    except Exception as e:
        print("\n⚠️  readme rebuild skipped: {}".format(e))

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
