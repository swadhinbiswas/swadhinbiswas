import datetime
from dateutil import relativedelta
import requests
import os
from lxml import etree
import time
import hashlib

# Fine-grained personal access token with All Repositories access:
# Account permissions: read:Followers, read:Starring, read:Watching
# Repository permissions: read:Commit statuses, read:Contents, read:Issues, read:Metadata, read:Pull Requests
# Issues and pull requests permissions not needed at the moment, but may be used in the future
HEADERS = {"authorization": "token " + os.environ["ACCESS_TOKEN"]}
USER_NAME = os.environ["USER_NAME"]
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
    Returns a properly formatted number
    e.g.
    'day' + format_plural(diff.days) == 5
    >>> '5 days'
    'day' + format_plural(diff.days) == 1
    >>> '1 day'
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
                f"{func_name} failed with {request.status_code}. Retrying in {2**attempt} seconds..."
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
        func_name, " has failed with a", request.status_code, request.text, QUERY_COUNT
    )


def graph_commits(start_date, end_date):
    """
    Uses GitHub's GraphQL v4 API to return my total commit count
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
    Uses GitHub's GraphQL v4 API to return my total repository, star, or lines of code count.
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
    Uses GitHub's GraphQL v4 API and cursor pagination to fetch 50 commits from a repository at a time
    """
    query_count("recursive_loc")
    query = """
    query ($repo_name: String!, $owner: String!, $cursor: String) {
        repository(name: $repo_name, owner: $owner) {
            defaultBranchRef {
                target {
                    ... on Commit {
                        history(first: 50, after: $cursor) {
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
    variables = {"repo_name": repo_name, "owner": owner, "cursor": cursor}
    for attempt in range(MAX_RETRIES):
        request = requests.post(
            "https://api.github.com/graphql",
            json={"query": query, "variables": variables},
            headers=HEADERS,
        )  # I cannot use simple_request(), because I want to save the file before raising Exception
        if request.status_code == 200:
            break
        if request.status_code in [500, 502, 503, 504]:
            print(
                f"recursive_loc failed with {request.status_code}. Retrying in {2**attempt} seconds..."
            )
            time.sleep(2**attempt)
            continue
        break
    if request.status_code == 200:
        if (
            request.json()["data"]["repository"]["defaultBranchRef"] != None
        ):  # Only count commits if repo isn't empty
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
            return 0
    force_close_file(
        data, cache_comment
    )  # saves what is currently in the file before this program crashes
    if request.status_code == 403:
        raise Exception(
            "Too many requests in a short amount of time!\nYou've hit the non-documented anti-abuse limit!"
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
    Recursively call recursive_loc (since GraphQL can only search 100 commits at a time)
    only adds the LOC value of commits authored by me
    """
    for node in history["edges"]:
        if node["node"]["author"]["user"] == OWNER_ID:
            my_commits += 1
            addition_total += node["node"]["additions"]
            deletion_total += node["node"]["deletions"]

    if history["edges"] == [] or not history["pageInfo"]["hasNextPage"]:
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
    owner_affiliation, comment_size=0, force_cache=False, cursor=None, edges=[]
):
    """
    Uses GitHub's GraphQL v4 API to query all the repositories I have access to (with respect to owner_affiliation)
    Queries 60 repos at a time, because larger queries give a 502 timeout error and smaller queries send too many
    requests and also give a 502 error.
    Returns the total number of lines of code in all repositories
    """
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
    if request.json()["data"]["user"]["repositories"]["pageInfo"][
        "hasNextPage"
    ]:  # If repository data has another page
        edges += request.json()["data"]["user"]["repositories"][
            "edges"
        ]  # Add on to the LoC count
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
    Checks each repository in edges to see if it has been updated since the last time it was cached
    If it has, run recursive_loc on that repository to update the LOC count
    """
    # Filter out None edges and nodes (deleted/private repos)
    edges = [
        e
        for e in edges
        if e is not None
        and e.get("node") is not None
        and e["node"].get("nameWithOwner") is not None
    ]

    cached = True  # Assume all repositories are cached
    filename = (
        "cache/" + hashlib.sha256(USER_NAME.encode("utf-8")).hexdigest() + ".txt"
    )  # Create a unique filename for each user
    try:
        with open(filename, "r") as f:
            data = f.readlines()
    except FileNotFoundError:  # If the cache file doesn't exist, create it
        data = []
        if comment_size > 0:
            for _ in range(comment_size):
                data.append(
                    "This line is a comment block. Write whatever you want here.\n"
                )
        with open(filename, "w") as f:
            f.writelines(data)

    if (
        len(data) - comment_size != len(edges) or force_cache
    ):  # If the number of repos has changed, or force_cache is True
        cached = False
        flush_cache(edges, filename, comment_size)
        with open(filename, "r") as f:
            data = f.readlines()

    cache_comment = data[:comment_size]  # save the comment block
    data = data[comment_size:]  # remove those lines
    for index in range(len(edges)):
        repo_hash, commit_count, *__ = data[index].split()
        if (
            repo_hash
            == hashlib.sha256(
                edges[index]["node"]["nameWithOwner"].encode("utf-8")
            ).hexdigest()
        ):
            try:
                if (
                    int(commit_count)
                    != edges[index]["node"]["defaultBranchRef"]["target"]["history"][
                        "totalCount"
                    ]
                ):
                    # if commit count has changed, update loc for that repo
                    owner, repo_name = edges[index]["node"]["nameWithOwner"].split("/")
                    loc = recursive_loc(owner, repo_name, data, cache_comment)
                    data[index] = (
                        repo_hash
                        + " "
                        + str(
                            edges[index]["node"]["defaultBranchRef"]["target"][
                                "history"
                            ]["totalCount"]
                        )
                        + " "
                        + str(loc[2])
                        + " "
                        + str(loc[0])
                        + " "
                        + str(loc[1])
                        + "\n"
                    )
            except TypeError:  # If the repo is empty
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
    Wipes the cache file
    This is called when the number of repositories changes or when the file is first created
    """
    with open(filename, "r") as f:
        data = []
        if comment_size > 0:
            data = f.readlines()[:comment_size]  # only save the comment
    with open(filename, "w") as f:
        f.writelines(data)
        for node in edges:
            # Skip None edges and nodes (deleted/private repos)
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
    Forces the file to close, preserving whatever data was written to it
    This is needed because if this function is called, the program would've crashed before the file is properly saved and closed
    """
    filename = "cache/" + hashlib.sha256(USER_NAME.encode("utf-8")).hexdigest() + ".txt"
    with open(filename, "w") as f:
        f.writelines(cache_comment)
        f.writelines(data)
    print(
        "There was an error while writing to the cache file. The file,",
        filename,
        "has had the partial data saved and closed.",
    )


def stars_counter(data):
    """
    Count total stars in repositories owned by me
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
    Parse SVG files and update elements with my age, commits, stars, repositories, and lines written
    """
    tree = etree.parse(filename)
    root = tree.getroot()
    # Update stats in the new card layout
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
        "{:,}".format(commit_data)
        if isinstance(commit_data, int)
        else str(commit_data),
    )
    find_and_replace(
        root,
        "follower_data",
        "{:,}".format(follower_data)
        if isinstance(follower_data, int)
        else str(follower_data),
    )
    find_and_replace(
        root, "loc_data", loc_data[2] if isinstance(loc_data, list) else str(loc_data)
    )
    find_and_replace(
        root, "loc_add", loc_data[0] if isinstance(loc_data, list) else "..."
    )
    find_and_replace(
        root, "loc_del", loc_data[1] if isinstance(loc_data, list) else "..."
    )
    # Cosmos SVG additional fields
    # Convert age format from "3 years, 8 months, 27 days" to "3 yrs · 8 mo · 27 d"
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
        "{:,}".format(contrib_data)
        if isinstance(contrib_data, int)
        else str(contrib_data),
    )
    find_and_replace(
        root,
        "star_planet",
        "{:,}".format(star_data) if isinstance(star_data, int) else str(star_data),
    )
    # Format LOC as abbreviated value for planet display (e.g. "7.34M")
    if isinstance(loc_data, list):
        try:
            net_loc = int(loc_data[2].replace(",", ""))
            if net_loc >= 1_000_000:
                loc_abbrev = "{:.2f}M".format(net_loc / 1_000_000)
            elif net_loc >= 1_000:
                loc_abbrev = "{:.1f}K".format(net_loc / 1_000)
            else:
                loc_abbrev = str(net_loc)
        except (ValueError, IndexError):
            loc_abbrev = loc_data[2]
    else:
        loc_abbrev = str(loc_data)
    find_and_replace(root, "loc_planet", loc_abbrev)

    # ── Streak ──
    if streak_data is not None:
        find_and_replace(root, "streak_data", str(streak_data))

    # ── Language percentages ──
    if lang_data is not None:
        for i, (lang_name, pct) in enumerate(lang_data):
            find_and_replace(root, "lang_pct_{}".format(i), "{}%".format(pct))

    # ── Yearly contribution breakdown ──
    if yearly_data is not None:
        max_count = max(yearly_data.values()) if yearly_data else 1
        for year, count in yearly_data.items():
            find_and_replace(root, "year_{}".format(year), "{:,}".format(count))
        # Update total contributions text in right panel
        total_contribs = sum(yearly_data.values())
        find_and_replace(root, "total_contrib", "{:,}".format(total_contribs))
        # Update contribution ring commits label (abbreviated)
        if total_contribs >= 1_000:
            ring_label = "{:.1f}K".format(total_contribs / 1_000)
        else:
            ring_label = "{:,}".format(total_contribs)
        find_and_replace(root, "ring_commits", ring_label)
        # Update star ring label
        find_and_replace(
            root,
            "ring_stars",
            "{:,}".format(star_data) if isinstance(star_data, int) else str(star_data),
        )

    # ── Developer Score & Rank ──
    if score_data is not None:
        score_val, rank_val = score_data
        find_and_replace(root, "score_left", str(score_val))
        find_and_replace(root, "rank_left", rank_val)
        find_and_replace(root, "score_right", str(score_val))
        find_and_replace(root, "rank_right", rank_val)

    # ── Recent Active Projects ──
    if recent_repos is not None:
        for i, (repo_name, repo_lang, repo_time) in enumerate(recent_repos[:4]):
            find_and_replace(root, "project_name_{}".format(i), repo_name)
            find_and_replace(root, "project_lang_{}".format(i), repo_lang)
            find_and_replace(root, "project_time_{}".format(i), repo_time)

    tree.write(filename, encoding="utf-8", xml_declaration=True)


def justify_format(root, element_id, new_text, length=0):
    """
    Updates and formats the text of the element, and modifes the amount of dots in the previous element to justify the new text on the svg
    """
    if isinstance(new_text, int):
        new_text = f"{'{:,}'.format(new_text)}"
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
    Finds the element in the SVG file and replaces its text with a new value
    """
    element = root.find(f".//*[@id='{element_id}']")
    if element is not None:
        element.text = new_text


def commit_counter(comment_size):
    """
    Counts up my total commits, using the cache file created by cache_builder.
    """
    total_commits = 0
    filename = (
        "cache/" + hashlib.sha256(USER_NAME.encode("utf-8")).hexdigest() + ".txt"
    )  # Use the same filename as cache_builder
    with open(filename, "r") as f:
        data = f.readlines()
    cache_comment = data[:comment_size]  # save the comment block
    data = data[comment_size:]  # remove those lines
    for line in data:
        total_commits += int(line.split()[2])
    return total_commits


def contribution_getter(acc_date_str):
    """
    Returns total GitHub contributions and per-year breakdown across all years
    by summing graph_commits() for each year since account creation.
    acc_date_str: ISO format date string like '2022-06-14T...'
    Returns: (total, {year: count, ...})
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
    Returns the current contribution streak (number of consecutive days
    with at least 1 contribution, ending today or yesterday).
    Uses the contribution calendar weeks data from GitHub GraphQL API.
    """
    query_count("streak_getter")
    today = datetime.datetime.today()
    # Fetch last ~90 days of contribution data
    start = (today - datetime.timedelta(days=90)).strftime("%Y-%m-%dT00:00:00Z")
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
    # Flatten all days into a sorted list (oldest first)
    days = []
    for week in weeks:
        for day in week["contributionDays"]:
            days.append(day)
    # Walk backwards from today to count consecutive days with contributions > 0
    streak = 0
    today_str = today.strftime("%Y-%m-%d")
    yesterday_str = (today - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    # Build a date->count map
    day_map = {d["date"]: d["contributionCount"] for d in days}
    # Start from today, allow today to have 0 if yesterday had contributions
    current = today
    # If today has 0 contributions, check if yesterday had some (streak is still alive)
    if day_map.get(today_str, 0) == 0:
        current = today - datetime.timedelta(days=1)
    while True:
        date_str = current.strftime("%Y-%m-%d")
        if day_map.get(date_str, 0) > 0:
            streak += 1
            current -= datetime.timedelta(days=1)
        else:
            break
    return streak


def language_getter():
    """
    Returns the top 5 languages by bytes across all owned repositories.
    Returns a list of (language_name, percentage) tuples sorted by percentage descending.
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
    # Sort by size descending and compute percentages
    total_size = sum(all_languages.values())
    if total_size == 0:
        return []
    sorted_langs = sorted(all_languages.items(), key=lambda x: x[1], reverse=True)
    # Return top 5 with percentages
    result = []
    for name, size in sorted_langs[:5]:
        pct = round(size / total_size * 100)
        result.append((name, pct))
    # Ensure percentages sum makes sense - adjust last one if needed
    return result


def recent_repos_getter():
    """
    Returns the 4 most recently pushed repositories (owned, non-fork) with:
    - name (repo name only, not owner/name)
    - primary language
    - pushedAt timestamp (formatted as relative time like "2d ago", "1w ago")
    Returns list of tuples: [(name, language, time_ago), ...]
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
            # Calculate relative time
            pushed = datetime.datetime.strptime(
                node["pushedAt"], "%Y-%m-%dT%H:%M:%SZ"
            ).replace(tzinfo=datetime.timezone.utc)
            delta = now - pushed
            days = delta.days
            if days == 0:
                hours = delta.seconds // 3600
                if hours == 0:
                    time_ago = "just now"
                else:
                    time_ago = "{}h ago".format(hours)
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
    Computes a developer score (0-100) and rank based on GitHub stats.
    Returns (score, rank_letter).
    """
    import math

    # Weighted scoring with diminishing returns (log scale)
    commit_score = min(30, 30 * math.log10(max(commits, 1)) / math.log10(10000))
    star_score = min(25, 25 * math.log10(max(stars, 1)) / math.log10(5000))
    repo_score = min(10, 10 * math.log10(max(repos, 1)) / math.log10(200))
    follower_score = min(15, 15 * math.log10(max(followers, 1)) / math.log10(1000))
    loc_score = min(20, 20 * math.log10(max(loc_net, 1)) / math.log10(10_000_000))
    score = int(commit_score + star_score + repo_score + follower_score + loc_score)
    score = min(100, max(0, score))
    # Rank thresholds
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
    Returns the account ID and creation time of the user
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
    return {"id": request.json()["data"]["user"]["id"]}, request.json()["data"]["user"][
        "createdAt"
    ]


def follower_getter(username):
    """
    Returns the number of followers of the user
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
    """
    Counts how many times the GitHub GraphQL API is called
    """
    global QUERY_COUNT
    QUERY_COUNT[funct_id] += 1


def perf_counter(funct, *args):
    """
    Calculates the time it takes for a function to run
    Returns the function result and the time differential
    """
    start = time.perf_counter()
    funct_return = funct(*args)
    return funct_return, time.perf_counter() - start


def formatter(query_type, difference, funct_return=False, whitespace=0):
    """
    Prints a formatted time differential
    Returns formatted result if whitespace is specified, otherwise returns raw result
    """
    print("{:<23}".format("   " + query_type + ":"), sep="", end="")
    print("{:>12}".format("%.4f" % difference + " s ")) if difference > 1 else print(
        "{:>12}".format("%.4f" % (difference * 1000) + " ms")
    )
    if whitespace:
        return f"{'{:,}'.format(funct_return): <{whitespace}}"
    return funct_return


if __name__ == "__main__":
    """
    Andrew Grant (Andrew6rant), 2022-2025
    """
    print("Calculation times:")
    # define global variable for owner ID and calculate user's creation date
    # e.g {'id': 'MDQ6VXNlcjU3MzMxMTM0'} and 2019-11-03T21:15:07Z for username 'Andrew6rant'
    user_data, user_time = perf_counter(user_getter, USER_NAME)
    OWNER_ID, acc_date = user_data
    formatter("account data", user_time)

    # Account age from creation date (not personal birthday)
    age_data, age_time = perf_counter(account_age, acc_date)
    formatter("age calculation", age_time)

    total_loc, loc_time = perf_counter(
        loc_query, ["OWNER", "COLLABORATOR", "ORGANIZATION_MEMBER"], 7
    )
    formatter("LOC (cached)", loc_time) if total_loc[-1] else formatter(
        "LOC (no cache)", loc_time
    )

    # Total contributions (commits + PRs + issues + reviews) across all years
    contrib_result, contrib_time = perf_counter(contribution_getter, acc_date)
    contrib_data, yearly_data = contrib_result
    formatter("contributions", contrib_time)

    # Use contributions as commit_data since it represents all GitHub activity
    commit_data = contrib_data
    commit_time = 0

    star_data, star_time = perf_counter(graph_repos_stars, "stars", ["OWNER"])
    repo_data, repo_time = perf_counter(graph_repos_stars, "repos", ["OWNER"])
    follower_data, follower_time = perf_counter(follower_getter, USER_NAME)

    # Streak
    streak_data, streak_time = perf_counter(streak_getter)
    formatter("streak", streak_time)

    # Language stats
    lang_data, lang_time = perf_counter(language_getter)
    formatter("languages", lang_time)

    # Recent active projects
    recent_repos, recent_repos_time = perf_counter(recent_repos_getter)
    formatter("recent repos", recent_repos_time)

    for index in range(len(total_loc) - 1):
        total_loc[index] = "{:,}".format(
            total_loc[index]
        )  # format added, deleted, and total LOC

    # Compute developer score
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

    svg_overwrite(
        "dark_mode.svg",
        age_data,
        commit_data,
        star_data,
        repo_data,
        contrib_data,
        follower_data,
        total_loc[:-1],
    )
    svg_overwrite(
        "light_mode.svg",
        age_data,
        commit_data,
        star_data,
        repo_data,
        contrib_data,
        follower_data,
        total_loc[:-1],
    )
    svg_overwrite(
        "cosmos.svg",
        age_data,
        commit_data,
        star_data,
        repo_data,
        contrib_data,
        follower_data,
        total_loc[:-1],
        streak_data=streak_data,
        lang_data=lang_data,
        yearly_data=yearly_data,
        score_data=score_data,
        recent_repos=recent_repos,
    )

    # Print total function time
    total_time = (
        user_time
        + age_time
        + loc_time
        + contrib_time
        + star_time
        + repo_time
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
