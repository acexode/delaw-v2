"""Seed the legal_content corpus with real Nigerian authorities.

Posts a curated set of well-known Nigerian cases and statutes to the running
AI service's POST /internal/ingest endpoint (which embeds + stores each record).

Usage (from apps/ai-service, with the venv active and the service running):
    python seed_data.py

Citations, courts, dates and holdings were verified against public legal
sources (NigeriaLII, judy.legal, vLex, Legalpedia, law journals). Authority
statuses are set for UI testing: most are GOOD_LAW, with one OVERRULED
(Lakanmi, nullified by Decree 28 of 1970) and one DOUBTED (Mojekwu v. Mojekwu,
disapproved in Mojekwu v. Iwuchukwu (2004) 11 NWLR (Pt. 883) 196).
"""

from __future__ import annotations

import os
import sys

import httpx

sys.path.insert(0, os.path.dirname(__file__))

from src.config import get_settings  # noqa: E402

SERVICE_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8000").rstrip("/")

RECORDS: list[dict] = [
    {
        "content_type": "CASE_LAW",
        "title": "Aliu Bello & Ors v. Attorney-General of Oyo State",
        "citation": "(1986) 5 NWLR (Pt. 45) 828",
        "suit_number": "SC.104/1985",
        "court": "Supreme Court",
        "date": "1986-12-05",
        "subject_area": ["Constitutional Law", "Human Rights", "Tort"],
        "authority_status": "GOOD_LAW",
        "summary": "Executing a convict while his appeal is pending is unconstitutional, and the State is liable in tort to the deceased's dependants.",
        "ratio": "The right of appeal guaranteed by the Constitution carries an implied stay of execution; a Governor cannot lawfully order the execution of a convict whose appeal has not been finally determined. Such a premature execution is unconstitutional and unlawful, and gives the dependants of the deceased a cause of action under the Torts Law.",
        "full_text": (
            "Nasiru Bello was convicted of armed robbery by the High Court of Oyo State and "
            "sentenced to death. He filed a notice of appeal to the Federal Court of Appeal "
            "within time. While that appeal was still pending, the Attorney-General of Oyo "
            "State recommended his execution to the Governor and the sentence was carried "
            "out before the appeal was heard.\n\n"
            "His dependants sued for the loss occasioned by the premature execution. The High "
            "Court and the Court of Appeal dismissed the claim, but the Supreme Court allowed "
            "the appeal. The Court held that although there was no express statutory provision "
            "for a stay of execution pending appeal in Oyo State, such a stay must be inferred "
            "from the constitutional rights of appeal and the appellate jurisdiction of the "
            "Court of Appeal and the Supreme Court. The execution of the deceased while his "
            "appeal was pending was therefore unconstitutional, unlawful and a reckless "
            "disregard of his right to life and right of appeal. By section 3 of the Torts Law, "
            "the death so caused was actionable, and the dependants were entitled to recover."
        ),
        "source": "Supreme Court of Nigeria",
        "source_url": "https://lite.judy.legal/case/bello-ors-v-ag-oyo-state-supreme-1986",
    },
    {
        "content_type": "CASE_LAW",
        "title": "Senator Abraham Adesanya v. President of the Federal Republic of Nigeria",
        "citation": "(1981) 2 NCLR 358",
        "suit_number": "SC.1/1981",
        "court": "Supreme Court",
        "date": "1981-05-15",
        "subject_area": ["Constitutional Law", "Locus Standi"],
        "authority_status": "GOOD_LAW",
        "summary": "A plaintiff has locus standi only where his own civil rights and obligations are in issue or in danger of being adversely affected.",
        "ratio": "The judicial powers of the court may be invoked only by a person who shows that his civil rights and obligations have been or are in danger of being violated or adversely affected by the act complained of. A litigant must demonstrate sufficient personal interest beyond that of the general public.",
        "full_text": (
            "The appellant, a serving Senator, sued to set aside the appointment of the 2nd "
            "respondent as Chairman of the Federal Electoral Commission, an appointment he had "
            "opposed during the Senate's confirmation debate and on which he had lost the vote. "
            "The Federal Court of Appeal held that he lacked locus standi, and he appealed.\n\n"
            "The Supreme Court dismissed the appeal. Per Bello JSC, standing will be accorded "
            "only to a plaintiff whose civil rights and obligations are in issue for "
            "determination; it is the cause of action that must be examined to ascertain "
            "whether a locus standi is disclosed. Having participated in the Senate's "
            "confirmation of the appointment and lost, the Senator had no personal interest "
            "distinct from that of the public and so could not invoke the court's jurisdiction. "
            "The decision became the foundational Nigerian authority on locus standi, although "
            "later cases have liberalised the test in public-interest litigation."
        ),
        "source": "Supreme Court of Nigeria",
        "source_url": "https://nigerialii.org/akn/ng/judgment/ngsc/1981/3/eng@1981-05-15",
    },
    {
        "content_type": "CASE_LAW",
        "title": "Imoro Kubor & Anor v. Hon. Seriake Henry Dickson & Ors",
        "citation": "(2013) 4 NWLR (Pt. 1345) 534",
        "suit_number": "SC.369/2012",
        "court": "Supreme Court",
        "year": 2013,
        "subject_area": ["Evidence", "Electronic Evidence", "Election Petition"],
        "authority_status": "GOOD_LAW",
        "summary": "Computer-generated documents are admissible only where the conditions in section 84 of the Evidence Act 2011 are strictly satisfied.",
        "ratio": "A party seeking to tender a computer-generated document must do more than tender it from the bar; evidence must be led to establish the conditions in section 84(2) of the Evidence Act 2011, and, where the document is also a public document, only a certified true copy is admissible.",
        "full_text": (
            "In an election dispute, the appellants tendered from the bar internet print-outs "
            "(including a page of the Punch newspaper and a list of candidates) without calling "
            "any witness to lay a foundation. The question was whether such computer-generated "
            "documents were admissible.\n\n"
            "The Supreme Court held that they were not. Section 84 of the Evidence Act 2011 "
            "governs the admissibility of statements in documents produced by a computer, and "
            "a party must satisfy the conditions in section 84(2) — that the computer was in "
            "regular use, was operating properly, and that the information was supplied in the "
            "ordinary course of use — or file the certificate required by section 84(4). "
            "Because the documents were tendered from the bar with no such foundation, and "
            "because they were public documents tendered otherwise than as certified true "
            "copies, they were inadmissible regardless of relevance. The case is the leading "
            "Nigerian authority on the admissibility of electronic evidence."
        ),
        "source": "Supreme Court of Nigeria",
        "source_url": "https://www.lawglobalhub.com/",
    },
    {
        "content_type": "CASE_LAW",
        "title": "Attorney-General of Lagos State v. Attorney-General of the Federation",
        "citation": "(2003) 12 NWLR (Pt. 833) 1",
        "suit_number": "SC.353/2001",
        "court": "Supreme Court",
        "date": "2003-06-13",
        "subject_area": ["Constitutional Law", "Federalism", "Urban & Regional Planning"],
        "authority_status": "GOOD_LAW",
        "summary": "Physical planning is largely a residual matter; the Federal Government cannot impose planning duties on the States, and the autonomy of each tier of government is essential to the federation.",
        "ratio": "By section 2(2) of the 1999 Constitution Nigeria is a Federation in which the autonomy of each government is essential; any matter not on the Exclusive or Concurrent Legislative Lists is residual and within the exclusive competence of the States. Provisions of the Nigerian Urban and Regional Planning Decree No. 88 of 1992 that imposed duties on State Governments were therefore unconstitutional.",
        "full_text": (
            "Lagos State invoked the original jurisdiction of the Supreme Court under section "
            "232(1) of the 1999 Constitution, contending that urban and regional planning was "
            "a residual matter and that the Nigerian Urban and Regional Planning Decree No. 88 "
            "of 1992 was unconstitutional in so far as it conferred planning powers on, and "
            "imposed planning duties in respect of, the Federal Government within a State.\n\n"
            "The Supreme Court (by a majority) held that while the National Assembly and the "
            "Houses of Assembly have concurrent competence over aspects of planning, those "
            "provisions of Decree No. 88 of 1992 that imposed duties on State Governments "
            "offended the federal principle enshrined in section 2(2) of the Constitution and "
            "were void to that extent. Each government in the federation exists not as an "
            "appendage of another but as an autonomous entity able to exercise its own will in "
            "the conduct of its affairs free from the direction of another government."
        ),
        "source": "Supreme Court of Nigeria",
        "source_url": "https://legalpediaonline.com/a-g-lagos-state-v-a-g-federation/",
    },
    {
        "content_type": "CASE_LAW",
        "title": "The Owners of the MV Lupex v. Nigerian Overseas Chartering & Shipping Ltd",
        "citation": "(2003) 15 NWLR (Pt. 844) 469",
        "suit_number": "SC.21/2000",
        "court": "Supreme Court",
        "date": "2003-06-20",
        "subject_area": ["Arbitration", "Commercial Law", "Civil Procedure"],
        "authority_status": "GOOD_LAW",
        "summary": "Where parties have validly agreed to arbitrate, the court should stay court proceedings; commencing fresh litigation while arbitration is pending is an abuse of process.",
        "ratio": "So long as a valid arbitration clause subsists and the dispute falls within it, the court is bound to give due regard to the parties' voluntary agreement by staying proceedings in favour of arbitration, absent strong and compelling reasons to the contrary.",
        "full_text": (
            "The parties' charter-party agreement contained a clause referring disputes to "
            "arbitration in London. Notwithstanding that arbitration had commenced in London, "
            "the respondent sued the appellant in the Federal High Court, Lagos, for damages "
            "arising from the same charter-party. The appellant applied for a stay of "
            "proceedings under section 5 of the Arbitration and Conciliation Act; the Federal "
            "High Court refused and the Court of Appeal affirmed the refusal.\n\n"
            "On further appeal, the Supreme Court allowed the appeal and ordered a stay. It "
            "held that the trial court had failed to exercise its discretion properly: where "
            "parties have freely and validly agreed to submit disputes to arbitration, that "
            "agreement is binding, and instituting a parallel suit during the pendency of the "
            "arbitration is an abuse of the process of court. Courts must support, not "
            "undermine, arbitration agreements voluntarily entered into by the parties."
        ),
        "source": "Supreme Court of Nigeria",
        "source_url": "https://www.judy.legal/case/the-owners-of-the-m-vlupex-v-nigerian-overseas-chartering-and-shipping-ltd-supreme-2003",
    },
    {
        "content_type": "CASE_LAW",
        "title": "Rt. Hon. Rotimi Chibuike Amaechi v. Independent National Electoral Commission & Ors",
        "citation": "(2008) 5 NWLR (Pt. 1080) 227",
        "suit_number": "SC.252/2007",
        "court": "Supreme Court",
        "date": "2008-01-18",
        "subject_area": ["Election Law", "Constitutional Law", "Political Parties"],
        "authority_status": "GOOD_LAW",
        "summary": "It is the political party, not the individual candidate, that contests and wins an election; a validly nominated candidate who is unlawfully substituted remains the party's candidate.",
        "ratio": "By section 221 of the 1999 Constitution it is the political party that canvasses for votes, so it is the party that wins an election. A candidate validly nominated and not removed in the manner prescribed by law (section 34 of the Electoral Act 2006) remains the party's candidate, and a court may declare him the winner even though he did not physically contest.",
        "full_text": (
            "Amaechi won the PDP governorship primaries for Rivers State and his name was "
            "submitted to INEC. The party later purported to substitute him with Omehia, "
            "giving 'error' as the reason, without the cogent and verifiable reason required "
            "by section 34 of the Electoral Act 2006. Omehia contested and the PDP won.\n\n"
            "The Supreme Court held that the purported substitution was ineffective because "
            "the statutory method had not been followed; in the eyes of the law Amaechi's name "
            "was never withdrawn. Since, under section 221 of the Constitution, only a party "
            "canvasses for votes, it is the party that wins an election; the validly nominated "
            "candidate simply steps into the shoes of the person invalidly substituted, "
            "whether that person won or lost. The Court accordingly declared Amaechi the duly "
            "elected Governor of Rivers State."
        ),
        "source": "Supreme Court of Nigeria",
        "source_url": "https://nigerialii.org/akn/ng/judgment/ngsc/2008/24/eng@2008-01-18",
    },
    {
        "content_type": "CASE_LAW",
        "title": "Mojekwu v. Mojekwu",
        "citation": "(1997) 7 NWLR (Pt. 512) 283",
        "suit_number": "CA/E/137/94",
        "court": "Court of Appeal",
        "date": "1997-04-10",
        "subject_area": ["Customary Law", "Inheritance", "Human Rights"],
        "authority_status": "DOUBTED",
        "summary": "The Court of Appeal held the Nnewi 'oli-ekpe' custom (excluding females from inheritance) repugnant to natural justice — reasoning later disapproved by the Supreme Court for being raised suo motu.",
        "ratio": "A custom that discriminates against women by excluding them from inheritance is repugnant to natural justice, equity and good conscience and offends constitutional guarantees of equality, and a court will not enforce it. (The Supreme Court in Mojekwu v. Iwuchukwu (2004) 11 NWLR (Pt. 883) 196 disapproved the Court of Appeal's pronouncement as having been made suo motu without being an issue between the parties.)",
        "full_text": (
            "The appellant claimed the disputed property at Onitsha as the only surviving male "
            "relative, relying on the Nnewi custom of 'oli-ekpe', under which the eldest "
            "surviving male, or a nephew where the direct male line has failed, inherits to the "
            "exclusion of females. The property was in fact held under Mgbelekeke family kola "
            "tenancy.\n\n"
            "The Court of Appeal (Enugu Division), per Tobi JCA, dismissed the claim. It held "
            "that the applicable law was the kola tenancy, under which children of either sex "
            "may inherit, and went on to declare the oli-ekpe custom repugnant to natural "
            "justice, equity and good conscience and inconsistent with constitutional "
            "guarantees of equality. On further appeal in Mojekwu v. Iwuchukwu (2004) 11 NWLR "
            "(Pt. 883) 196 the Supreme Court affirmed the result on the kola-tenancy ground but "
            "disapproved the repugnancy pronouncement as having been made suo motu without the "
            "validity of the custom being an issue raised by the parties. The repugnancy "
            "reasoning should therefore be cited with caution."
        ),
        "source": "Court of Appeal, Enugu Division",
        "source_url": "https://www.equalrightstrust.org/ertdocumentbank/Mojekwu%20v%20Mojekwu.pdf",
    },
    {
        "content_type": "CASE_LAW",
        "title": "E. O. Lakanmi & Anor v. Attorney-General (Western State) & Ors",
        "citation": "(1971) 1 UILR 201",
        "suit_number": "SC.58/69",
        "court": "Supreme Court",
        "date": "1970-04-24",
        "subject_area": ["Constitutional Law", "Separation of Powers"],
        "authority_status": "OVERRULED",
        "summary": "The Supreme Court held that the military government could not exercise judicial power and struck down a forfeiture decree — a decision promptly nullified by Decree No. 28 of 1970.",
        "ratio": "On the Court's analysis the Federal Military Government was a constitutional interim government bound by separation of powers, so a decree that validated the forfeiture order of a tribunal amounted to an unconstitutional usurpation of judicial power. (This decision was nullified by the Federal Military Government (Supremacy and Enforcement of Powers) Decree No. 28 of 1970, which asserted the supremacy of decrees and ousted the courts' jurisdiction to question them.)",
        "full_text": (
            "The appellants challenged the forfeiture of their assets ordered under the Public "
            "Officers and other Persons (Investigation of Assets) Edict No. 5 of 1967 "
            "(Western State), contending that it was inconsistent with the Federal Decree "
            "covering the same field and that the validating Decree No. 45 of 1968 was a "
            "usurpation of judicial power.\n\n"
            "The Supreme Court accepted the argument, treating the Federal Military Government "
            "as a constitutional interim administration whose decrees prevailed over the "
            "Constitution only to the extent that they validly amended it, and holding the "
            "forfeiture invalid as a usurpation of the judicial function. The Federal Military "
            "Government responded within weeks by promulgating the Federal Military Government "
            "(Supremacy and Enforcement of Powers) Decree No. 28 of 1970, which characterised "
            "the military takeover as a revolution, affirmed the supremacy of decrees over the "
            "Constitution and ousted the jurisdiction of the courts to question any decree or "
            "edict. The decision was thereby nullified and should not be relied upon without "
            "noting Decree No. 28 of 1970."
        ),
        "source": "Supreme Court of Nigeria",
        "source_url": "https://ng.vlex.com/vid/lakanmi-anor-v-attorney-914452443",
    },
    {
        "content_type": "STATUTE",
        "title": "Constitution of the Federal Republic of Nigeria 1999 (as amended)",
        "citation": "Cap C23 LFN 2004",
        "court": None,
        "date": "1999-05-29",
        "subject_area": ["Constitutional Law"],
        "authority_status": "GOOD_LAW",
        "summary": "The supreme law of Nigeria; it is binding on all authorities and persons, and any other law inconsistent with it is void to the extent of the inconsistency.",
        "ratio": "Section 1(1) and (3): the Constitution is supreme and its provisions have binding force on all authorities and persons throughout Nigeria; if any other law is inconsistent with the Constitution, the Constitution prevails and that other law is, to the extent of the inconsistency, void.",
        "full_text": (
            "The Constitution of the Federal Republic of Nigeria 1999 (as amended) is the "
            "grundnorm of the Nigerian legal order. Section 1 establishes its supremacy and "
            "binding force and renders void any inconsistent law. Chapter II sets out the "
            "Fundamental Objectives and Directive Principles of State Policy; Chapter IV "
            "guarantees fundamental rights including the right to life (section 33), the right "
            "to dignity of the human person (section 34), personal liberty (section 35), the "
            "right to fair hearing (section 36) and the protection from compulsory acquisition "
            "of property save on the conditions in section 44 (overriding public interest and "
            "prompt payment of compensation). Section 4 distributes legislative powers between "
            "the National Assembly and the State Houses of Assembly through the Exclusive and "
            "Concurrent Legislative Lists, with residual matters reserved to the States."
        ),
        "source": "Laws of the Federation of Nigeria",
        "source_url": "https://www.nigeria-law.org/ConstitutionOfTheFederalRepublicOfNigeria.htm",
    },
    {
        "content_type": "STATUTE",
        "title": "Land Use Act 1978",
        "citation": "Cap L5 LFN 2004",
        "court": None,
        "date": "1978-03-29",
        "subject_area": ["Land Law", "Property"],
        "authority_status": "GOOD_LAW",
        "summary": "Vests all land in each State in the Governor to hold in trust for the people; rights of occupancy are granted by the Governor and may be revoked for overriding public interest.",
        "ratio": "Section 1 vests all land comprised in the territory of each State (except land vested in the Federal Government) in the Governor, to be held in trust and administered for the use and common benefit of all Nigerians. A statutory right of occupancy may be revoked only for an overriding public interest and in strict compliance with the conditions prescribed by section 28.",
        "full_text": (
            "The Land Use Act 1978 fundamentally restructured land tenure in Nigeria. By "
            "section 1, all land in the territory of each State (other than land vested in the "
            "Federal Government or its agencies) is vested in the Governor of that State, to be "
            "held in trust and administered for the use and common benefit of all Nigerians. "
            "The Governor grants statutory rights of occupancy in respect of land in urban "
            "areas, while Local Governments grant customary rights of occupancy elsewhere. "
            "Section 22 restricts the alienation of a statutory right of occupancy without the "
            "Governor's consent. Section 28 permits revocation of a right of occupancy for "
            "overriding public interest, and the courts have insisted on strict compliance "
            "with its conditions: a purported revocation for a private purpose, or otherwise "
            "outside section 28, is null and void."
        ),
        "source": "Laws of the Federation of Nigeria",
        "source_url": "https://www.nigeria-law.org/LandUseAct.htm",
    },
    {
        "content_type": "STATUTE",
        "title": "Evidence Act 2011",
        "citation": "Act No. 18 of 2011",
        "court": None,
        "date": "2011-06-03",
        "subject_area": ["Evidence", "Civil Procedure", "Criminal Procedure"],
        "authority_status": "GOOD_LAW",
        "summary": "The principal statute governing the admissibility of evidence in Nigerian courts; section 84 provides for the admissibility of computer-generated (electronic) evidence.",
        "ratio": "Section 84(1)-(2): a statement in a document produced by a computer is admissible as evidence of any fact stated in it of which direct oral evidence would be admissible, provided the conditions in section 84(2) are satisfied; section 84(4) permits proof of those conditions by a certificate.",
        "full_text": (
            "The Evidence Act 2011 repealed and replaced the old Evidence Act and modernised "
            "the law of evidence in Nigeria, applying to all judicial proceedings in or before "
            "courts in Nigeria. Among its key innovations is section 84, which expressly "
            "provides for the admissibility of statements contained in documents produced by a "
            "computer. Such a statement is admissible if it is shown that the computer was "
            "used regularly to store or process information, was operating properly over the "
            "relevant period, and that the information was supplied to it in the ordinary "
            "course of its activities. Section 84(4) allows these matters to be proved by a "
            "certificate identifying the document and describing the manner of its production. "
            "The provision was authoritatively interpreted by the Supreme Court in Kubor v. "
            "Dickson (2013) 4 NWLR (Pt. 1345) 534."
        ),
        "source": "National Assembly of Nigeria",
        "source_url": "https://lawsofnigeria.placng.org/laws/E14.pdf",
    },
    {
        "content_type": "STATUTE",
        "title": "Arbitration and Mediation Act 2023",
        "citation": "Act No. 9 of 2023",
        "court": None,
        "date": "2023-05-26",
        "subject_area": ["Arbitration", "Alternative Dispute Resolution", "Commercial Law"],
        "authority_status": "GOOD_LAW",
        "summary": "Repeals and replaces the Arbitration and Conciliation Act; provides a unified legal framework for domestic and international commercial arbitration and mediation in Nigeria.",
        "ratio": "The Act gives effect to arbitration agreements and provides that a court before which an action is brought in a matter that is the subject of an arbitration agreement shall, on the application of a party, stay proceedings and refer the parties to arbitration; it also introduces, among other things, provision for an Award Review Tribunal and third-party funding.",
        "full_text": (
            "The Arbitration and Mediation Act 2023 repealed the Arbitration and Conciliation "
            "Act (Cap A18 LFN 2004) and established a modern, consolidated framework for "
            "arbitration and mediation in Nigeria, drawing on the UNCITRAL Model Law. It "
            "applies to both domestic and international commercial arbitration. The Act "
            "preserves party autonomy and the binding nature of arbitration agreements, "
            "requiring a court to stay proceedings and refer parties to arbitration where the "
            "dispute falls within a valid arbitration agreement. Notable innovations include "
            "the option of an Award Review Tribunal, recognition of third-party funding of "
            "arbitration, provisions on interim measures and emergency arbitrators, and a "
            "framework for the recognition and enforcement of awards consistent with the New "
            "York Convention."
        ),
        "source": "National Assembly of Nigeria",
        "source_url": "https://www.nials.edu.ng/",
    },
]


def main() -> int:
    secret = get_settings().ai_service_secret
    headers = {"X-Service-Secret": secret, "Content-Type": "application/json"}
    ok = 0
    with httpx.Client(base_url=SERVICE_URL, timeout=60.0) as client:
        for record in RECORDS:
            title = record["title"]
            try:
                resp = client.post("/internal/ingest", json=record, headers=headers)
            except httpx.HTTPError as exc:
                print(f"  [FAIL] {title}: request failed - {exc}")
                continue
            if resp.status_code == 200:
                ok += 1
                print(f"  [OK]   [{record['authority_status']:>13}] {title} -> {resp.json()['id']}")
            else:
                print(f"  [FAIL] {title}: {resp.status_code} {resp.text[:500]}")

    print(f"\nIngested {ok}/{len(RECORDS)} records into legal_content.")
    return 0 if ok == len(RECORDS) else 1


if __name__ == "__main__":
    raise SystemExit(main())
