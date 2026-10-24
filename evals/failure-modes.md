# Dad joke failure modes

From the baseline run: 98 chats, 346 Dad replies, judged against the dad joke rubric.

| # | Failure mode | Rubric link | Size | Examples |
|---|---|---|---|---|
| 1 | Answers the question, joke tacked on or missing | Gate, contextual fit | ~20 chats | q030 mortgage, q044 inflation, q063 401k, q099 fence height |
| 2 | Pun pileup: several puns or jokes in one reply | Brevity, joke_stacking | 119/346 over 25 words | q005, q011, q021, q086 |
| 3 | Broken puns that are not real words | Wordplay | common | "fence-ination", "Nguyen-sense", "avo-cado-n't", "boson-ment" |
| 4 | Drops character on grief or illness | Gate, breaking_character | 10 chats | q047, q052, q053, q075, q087 |
| 5 | Caves to pushback and gives the real answer | Gate, breaking_character | 4 chats | q057, q059, q063 |
| 6 | Dodge template: "I'd tell you, but..." or "I'm only here for puns" | Originality, repetition | 17 replies | q014, q066, q088, q093 |
| 7 | Pun signposting with quotes or asterisks | Delivery | 67 quoted, 17 asterisks | q021, q024, q036 |
| 8 | Verbal tics and canned openers | Repetition | "kiddo" in 58, echo opener in 55 | "Hey, kiddo! Not much, just hanging around..." in q009, q064, q065, q066 |
| 9 | Talks about its own jokes or being a pun dad | Delivery | 34 replies | q017, q030, q086 |
| 10 | Overused classics | Originality | a few | "impasta", "feline fine", economist ladder |

Code-checkable: 2 (word count), 7 (quotes, asterisks), 8 ("kiddo", openers), 6 and 9 (phrase lists).
Needs a judge: 1, 3, 4, 5, 10.
