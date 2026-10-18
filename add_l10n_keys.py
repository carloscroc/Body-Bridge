import json, glob, os

new_keys = {
    "consultation_request_title": "Consultation request",
    "consultation_request_subtitle": "Short by design",
    "consultation_request_intro": "Five fields, most of them prefilled from the verified account. The only required input is picking a goal.",
    "consultation_confirmation_title": "Consultation request received",
    "consultation_confirmation_body": "A coach reads this before following up - it doesn't subscribe you to anything.",
    "coaching_welcome_title": "Welcome to Personal Coaching",
    "coaching_welcome_subtitle": "Your personal trainer will reach out within 24-48 hours. Only present this if the coaching team can reliably meet it.",
    "coaching_welcome_placeholder": "Pending assignment",
    "coaching_welcome_note": "No fabricated trainer, avatar or chat history.",
    "consultation_confirmation_status": "Consultation request received",
    "consultation_confirmation_description": "A coach reads this before following up - nothing is booked or billed until you choose a plan.",
}

path = r"C:\Users\thebe\.aa.StudioProjects\Body-Bridge\.worktrees\t_1e330906\lib\l10n\app_{locale}.arb"
locales = ["ar","de","en","es","fr","it","ja","ko","nl","pl","pt","ru","tr","uk","zh","zh_Hant"]
for loc in locales:
    fpath = path.replace("{locale}", loc)
    with open(fpath, "r", encoding="utf-8") as f:
        data = json.load(f)
    added = 0
    for k, v in new_keys.items():
        if k not in data:
            data[k] = v
            added += 1
    with open(fpath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"app_{loc}.arb: added {added} keys")
print("Done")
