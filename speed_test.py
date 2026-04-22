import requests
import os
from dotenv import load_dotenv

load_dotenv()
HEADERS = {"authorization": "token " + os.environ.get("GITHUB_TOKEN", os.environ.get("ACCESS_TOKEN", ""))}

query = """
query {
  repository(owner: "swadhinbiswas", name: "swadhinbiswas") {
    defaultBranchRef {
      target {
        ... on Commit {
          history(first: 100, author: {id: "MDQ6VXNlcjU4ODYwOTk3"}) {
            totalCount
            edges { node { additions deletions } }
          }
        }
      }
    }
  }
}
"""
req = requests.post("https://api.github.com/graphql", json={"query": query}, headers=HEADERS)
print(req.status_code)
print(req.json())
