import requests

access_token = "afc574053f55e8d983abf8e2900cbe068ed838bc"
url = "https://www.strava.com/api/v3/athlete/activities"

headers = {
    "Authorization": f"Bearer {access_token}"
}

response = requests.get(url, headers=headers, verify=False)  # 🔹 verify=False evita SSL
print(response.status_code, response.json())
