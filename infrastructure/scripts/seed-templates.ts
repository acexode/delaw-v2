import "dotenv/config";
import { and, eq } from "drizzle-orm";

import { db, documents, organisations, users } from "@delaw/db";

// Seeds the 10 DeLaw official Nigerian legal templates (spec §4.4 / Sprint 4).
// Official templates live in a dedicated system organisation so every tenant
// can read them via GET /api/v1/documents/templates. Idempotent.

const SYSTEM_ORG_SLUG = "delaw-official";
const SYSTEM_USER_EMAIL = "templates@delaw.africa";

type DocTypeValue =
  | "PLEADING"
  | "CONTRACT"
  | "BRIEF"
  | "MEMO"
  | "TEMPLATE"
  | "RESEARCH"
  | "GENERATED"
  | "UPLOADED";

interface TemplateSeed {
  name: string;
  category: string;
  jurisdiction: string;
  type: DocTypeValue;
  bodyHtml: string;
}

const h = (text: string) => `<h1>${text}</h1>`;
const sub = (text: string) => `<h2>${text}</h2>`;
const p = (text: string) => `<p>${text}</p>`;
const ol = (items: string[]) =>
  `<ol>${items.map((i) => `<li>${i}</li>`).join("")}</ol>`;

const TEMPLATES: TemplateSeed[] = [
  {
    name: "Writ of Summons (Federal High Court)",
    category: "Litigation",
    jurisdiction: "NG",
    type: "PLEADING",
    bodyHtml: [
      p("IN THE FEDERAL HIGH COURT OF NIGERIA"),
      p("IN THE [JUDICIAL DIVISION] JUDICIAL DIVISION"),
      p("HOLDEN AT [LOCATION]"),
      p("SUIT NO: FHC/[___]/CS/[___]/[YEAR]"),
      p("BETWEEN: [CLAIMANT NAME] ……………………… CLAIMANT"),
      p("AND"),
      p("[DEFENDANT NAME] ……………………… DEFENDANT"),
      h("WRIT OF SUMMONS"),
      p(
        "To the above-named Defendant of [ADDRESS FOR SERVICE]: You are hereby commanded that within forty-two (42) days after the service of this Writ on you, inclusive of the day of such service, you cause an appearance to be entered for you in an action at the suit of the Claimant.",
      ),
      p(
        "And take notice that in default of your so doing the Claimant may proceed therein, and judgment may be given in your absence.",
      ),
      sub("CLAIM"),
      p("The Claimant's claim against the Defendant is for: [STATE RELIEFS SOUGHT]."),
      ol([
        "A declaration that [____].",
        "An order of [____].",
        "The sum of ₦[____] being [____].",
        "Costs of this action.",
      ]),
      p("Issued at [LOCATION] this [___] day of [MONTH], [YEAR]."),
      p("____________________________"),
      p("REGISTRAR, FEDERAL HIGH COURT"),
      p(
        "This Writ was issued by [LEGAL PRACTITIONER], Legal Practitioner for the Claimant, whose address for service is [FIRM ADDRESS].",
      ),
    ].join(""),
  },
  {
    name: "Statement of Claim",
    category: "Litigation",
    jurisdiction: "NG",
    type: "PLEADING",
    bodyHtml: [
      p("IN THE [COURT]"),
      p("HOLDEN AT [LOCATION]"),
      p("SUIT NO: [____]"),
      p("BETWEEN: [CLAIMANT] ……………………… CLAIMANT"),
      p("AND"),
      p("[DEFENDANT] ……………………… DEFENDANT"),
      h("STATEMENT OF CLAIM"),
      ol([
        "The Claimant is [describe the Claimant and capacity].",
        "The Defendant is [describe the Defendant].",
        "[Plead the material facts giving rise to the cause of action, paragraph by paragraph].",
        "[Plead the breach / wrongful act complained of].",
        "[Plead the particulars of loss and damage suffered].",
      ]),
      sub("WHEREOF the Claimant claims against the Defendant as follows:"),
      ol([
        "A declaration that [____].",
        "The sum of ₦[____] being [special / general damages].",
        "Interest at the rate of [__]% per annum from [date] until judgment and thereafter at [__]% until final liquidation.",
        "Cost of this action.",
      ]),
      p("Dated this [___] day of [MONTH], [YEAR]."),
      p("____________________________"),
      p("[LEGAL PRACTITIONER], Counsel to the Claimant"),
    ].join(""),
  },
  {
    name: "Statement of Defence",
    category: "Litigation",
    jurisdiction: "NG",
    type: "PLEADING",
    bodyHtml: [
      p("IN THE [COURT]"),
      p("HOLDEN AT [LOCATION]"),
      p("SUIT NO: [____]"),
      p("BETWEEN: [CLAIMANT] ……………………… CLAIMANT"),
      p("AND"),
      p("[DEFENDANT] ……………………… DEFENDANT"),
      h("STATEMENT OF DEFENCE"),
      ol([
        "The Defendant admits paragraphs [____] of the Statement of Claim.",
        "The Defendant denies paragraphs [____] of the Statement of Claim and puts the Claimant to the strictest proof thereof.",
        "Save as is hereinafter expressly admitted, the Defendant denies each and every allegation of fact contained in the Statement of Claim as if same were herein set out and traversed seriatim.",
        "[Plead the Defendant's version of the material facts].",
        "[Plead any affirmative defences — limitation, estoppel, lack of locus standi, etc.].",
      ]),
      p(
        "WHEREOF the Defendant prays this Honourable Court to dismiss the Claimant's suit in its entirety with substantial costs.",
      ),
      p("Dated this [___] day of [MONTH], [YEAR]."),
      p("____________________________"),
      p("[LEGAL PRACTITIONER], Counsel to the Defendant"),
    ].join(""),
  },
  {
    name: "Non-Disclosure Agreement (Nigerian law)",
    category: "Commercial Agreements",
    jurisdiction: "NG",
    type: "CONTRACT",
    bodyHtml: [
      h("NON-DISCLOSURE AGREEMENT"),
      p(
        "THIS AGREEMENT is made this [___] day of [MONTH], [YEAR] BETWEEN [DISCLOSING PARTY], of [ADDRESS] (\"the Disclosing Party\") and [RECEIVING PARTY], of [ADDRESS] (\"the Receiving Party\").",
      ),
      sub("1. DEFINITIONS"),
      p(
        "\"Confidential Information\" means all information disclosed by the Disclosing Party, whether orally, in writing or otherwise, that is designated as confidential or would reasonably be understood to be confidential.",
      ),
      sub("2. OBLIGATIONS OF THE RECEIVING PARTY"),
      ol([
        "To hold the Confidential Information in strict confidence.",
        "Not to disclose the Confidential Information to any third party without prior written consent.",
        "To use the Confidential Information solely for the Purpose described herein.",
      ]),
      sub("3. EXCLUSIONS"),
      p(
        "The obligations do not apply to information that is or becomes publicly available otherwise than by breach of this Agreement.",
      ),
      sub("4. TERM"),
      p(
        "This Agreement shall remain in force for a period of [___] years from the date hereof.",
      ),
      sub("5. GOVERNING LAW"),
      p(
        "This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.",
      ),
      p("IN WITNESS WHEREOF the parties have executed this Agreement the day and year first above written."),
    ].join(""),
  },
  {
    name: "Employment Agreement",
    category: "Employment",
    jurisdiction: "NG",
    type: "CONTRACT",
    bodyHtml: [
      h("CONTRACT OF EMPLOYMENT"),
      p(
        "THIS CONTRACT OF EMPLOYMENT is made this [___] day of [MONTH], [YEAR] BETWEEN [EMPLOYER] (\"the Employer\") and [EMPLOYEE] (\"the Employee\").",
      ),
      sub("1. APPOINTMENT AND DURATION"),
      p(
        "The Employer appoints the Employee as [POSITION] with effect from [START DATE], subject to a probationary period of [___] months.",
      ),
      sub("2. REMUNERATION"),
      p(
        "The Employee shall be paid a gross salary of ₦[____] per [month/annum], subject to applicable statutory deductions (PAYE, pension and NHF).",
      ),
      sub("3. HOURS OF WORK AND LEAVE"),
      p(
        "Normal hours of work shall be [____]. The Employee is entitled to [___] working days of annual leave in line with the Labour Act.",
      ),
      sub("4. TERMINATION"),
      p(
        "Either party may terminate this contract by giving [___] notice in writing or payment in lieu, subject to the provisions of the Labour Act, Cap L1 LFN 2004.",
      ),
      sub("5. CONFIDENTIALITY"),
      p("The Employee shall not disclose the Employer's confidential information during or after employment."),
      sub("6. GOVERNING LAW"),
      p("This contract is governed by the laws of the Federal Republic of Nigeria."),
      p("SIGNED by the parties:"),
    ].join(""),
  },
  {
    name: "Shareholders Agreement",
    category: "Corporate",
    jurisdiction: "NG",
    type: "CONTRACT",
    bodyHtml: [
      h("SHAREHOLDERS AGREEMENT"),
      p(
        "THIS SHAREHOLDERS AGREEMENT is made this [___] day of [MONTH], [YEAR] AMONG the persons whose names appear in Schedule 1 (\"the Shareholders\") and [COMPANY NAME] (\"the Company\"), a company incorporated under the Companies and Allied Matters Act, 2020.",
      ),
      sub("1. SHARE CAPITAL AND SHAREHOLDING"),
      p("The issued share capital of the Company and the shareholding of each Shareholder is as set out in Schedule 1."),
      sub("2. BUSINESS OF THE COMPANY"),
      p("The business of the Company shall be [____]."),
      sub("3. BOARD OF DIRECTORS"),
      p("The Board shall consist of [___] directors appointed as follows: [____]."),
      sub("4. RESERVED MATTERS"),
      p("The following matters require the prior written consent of Shareholders holding not less than [__]% of the shares: [____]."),
      sub("5. TRANSFER OF SHARES"),
      p(
        "No Shareholder shall transfer shares except in accordance with the pre-emption provisions in this Agreement and the Articles of Association.",
      ),
      sub("6. DIVIDEND POLICY"),
      p("Subject to the CAMA 2020, the Company shall distribute [__]% of distributable profits as dividends."),
      sub("7. GOVERNING LAW AND DISPUTE RESOLUTION"),
      p(
        "This Agreement is governed by Nigerian law. Disputes shall be referred to arbitration under the Arbitration and Mediation Act, 2023, seated in [CITY].",
      ),
    ].join(""),
  },
  {
    name: "Deed of Assignment (Land)",
    category: "Real Estate",
    jurisdiction: "NG",
    type: "CONTRACT",
    bodyHtml: [
      h("DEED OF ASSIGNMENT"),
      p(
        "THIS DEED OF ASSIGNMENT is made this [___] day of [MONTH], [YEAR] BETWEEN [ASSIGNOR] (\"the Assignor\") of the one part AND [ASSIGNEE] (\"the Assignee\") of the other part.",
      ),
      sub("WHEREAS"),
      ol([
        "The Assignor is the holder of a [statutory/customary] right of occupancy over the property known as [DESCRIPTION OF PROPERTY] covered by [TITLE DOCUMENT].",
        "The Assignor has agreed to assign its unexpired residue of the said right of occupancy to the Assignee for the consideration hereinafter appearing.",
      ]),
      sub("NOW THIS DEED WITNESSES as follows:"),
      ol([
        "In consideration of the sum of ₦[____] paid by the Assignee to the Assignor (the receipt of which the Assignor acknowledges), the Assignor hereby assigns unto the Assignee ALL THAT property described in the Schedule hereto.",
        "TO HOLD the same unto the Assignee for the unexpired residue of the term granted, subject to the covenants and conditions in the original grant.",
        "The Assignor covenants that it has the right to assign and that the Assignee shall enjoy quiet possession.",
      ]),
      sub("THE SCHEDULE"),
      p("[FULL DESCRIPTION OF THE PROPERTY / SURVEY PLAN NO.]"),
      p(
        "IN WITNESS WHEREOF the parties have executed this Deed. The Governor's consent is required pursuant to the Land Use Act, Cap L5 LFN 2004.",
      ),
    ].join(""),
  },
  {
    name: "Letter Before Action",
    category: "Litigation",
    jurisdiction: "NG",
    type: "MEMO",
    bodyHtml: [
      p("[FIRM LETTERHEAD]"),
      p("Our Ref: [____]    Date: [____]"),
      p("[RECIPIENT NAME AND ADDRESS]"),
      p("Dear Sir/Madam,"),
      h("LETTER BEFORE ACTION: [SUBJECT MATTER]"),
      p("We act as Solicitors to [CLIENT NAME] (\"our client\"), on whose instructions we write."),
      p(
        "Our client informs us that [state the facts and the obligation owed / breach complained of].",
      ),
      p(
        "Despite repeated demands, you have failed and/or neglected to [state default]. This conduct is wrongful and actionable.",
      ),
      p(
        "TAKE NOTICE that unless you [state the required action — pay the sum of ₦[____] / remedy the breach] within [___] days of the date of this letter, we have firm instructions to commence legal proceedings against you without further notice, and at your own cost and risk.",
      ),
      p("This letter shall be relied upon as to costs."),
      p("Yours faithfully,"),
      p("____________________________"),
      p("[LEGAL PRACTITIONER], for: [FIRM NAME]"),
    ].join(""),
  },
  {
    name: "Affidavit (General Form)",
    category: "Litigation",
    jurisdiction: "NG",
    type: "PLEADING",
    bodyHtml: [
      p("IN THE [COURT]"),
      p("HOLDEN AT [LOCATION]"),
      p("SUIT NO: [____]"),
      h("AFFIDAVIT"),
      p(
        "I, [DEPONENT NAME], [Nationality], [Occupation], of [ADDRESS], do hereby make oath and state as follows:",
      ),
      ol([
        "That I am the [capacity in which the deponent makes the affidavit] in this matter and by virtue of which I am conversant with the facts herein deposed to.",
        "That I have the authority and consent of [____] to depose to this affidavit.",
        "[State the facts within the deponent's knowledge, one fact per paragraph].",
        "That I depose to this affidavit conscientiously believing the same to be true and correct in accordance with the Oaths Act.",
      ]),
      p("____________________________"),
      p("DEPONENT"),
      p("SWORN TO at the [____] Registry this [___] day of [MONTH], [YEAR]."),
      p("BEFORE ME"),
      p("____________________________"),
      p("COMMISSIONER FOR OATHS"),
    ].join(""),
  },
  {
    name: "Brief of Argument",
    category: "Litigation",
    jurisdiction: "NG",
    type: "BRIEF",
    bodyHtml: [
      p("IN THE [COURT OF APPEAL / SUPREME COURT]"),
      p("HOLDEN AT [LOCATION]"),
      p("APPEAL NO: [____]"),
      p("BETWEEN: [APPELLANT] ……………………… APPELLANT"),
      p("AND"),
      p("[RESPONDENT] ……………………… RESPONDENT"),
      h("APPELLANT'S BRIEF OF ARGUMENT"),
      sub("1.0 INTRODUCTION"),
      p("This is the Appellant's brief of argument filed pursuant to the Rules of this Honourable Court."),
      sub("2.0 STATEMENT OF FACTS"),
      p("[Concise statement of the material facts with references to the record of appeal]."),
      sub("3.0 ISSUES FOR DETERMINATION"),
      ol([
        "Whether [____].",
        "Whether [____].",
      ]),
      sub("4.0 ARGUMENT"),
      p(
        "On issue one, it is submitted that [____]. The Appellant relies on [CITE AUTHORITY] where it was held that [____].",
      ),
      sub("5.0 CONCLUSION"),
      p(
        "On the whole, the Appellant urges this Honourable Court to resolve the issues in its favour, allow the appeal and [state relief sought].",
      ),
      p("Dated this [___] day of [MONTH], [YEAR]."),
      p("____________________________"),
      p("[LEGAL PRACTITIONER], Counsel to the Appellant"),
    ].join(""),
  },
];

function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|h1|h2|li|ol)>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

async function main() {
  await db
    .insert(organisations)
    .values({
      name: "DeLaw Official",
      slug: SYSTEM_ORG_SLUG,
      type: "LAW_FIRM",
      plan: "ENTERPRISE",
      planStatus: "ACTIVE",
      country: "NG",
    })
    .onConflictDoNothing({ target: organisations.slug });

  const [org] = await db
    .select({ id: organisations.id })
    .from(organisations)
    .where(eq(organisations.slug, SYSTEM_ORG_SLUG))
    .limit(1);
  if (!org) throw new Error("Failed to create system organisation");

  await db
    .insert(users)
    .values({
      organisationId: org.id,
      email: SYSTEM_USER_EMAIL,
      // Placeholder hash; this account is never logged into.
      passwordHash: "x",
      fullName: "DeLaw Templates",
      role: "ADMIN",
      isActive: false,
    })
    .onConflictDoNothing({ target: users.email });

  const [systemUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SYSTEM_USER_EMAIL))
    .limit(1);
  if (!systemUser) throw new Error("Failed to create system user");

  let inserted = 0;
  for (const tpl of TEMPLATES) {
    const existing = await db
      .select({ id: documents.id })
      .from(documents)
      .where(
        and(
          eq(documents.organisationId, org.id),
          eq(documents.title, tpl.name),
          eq(documents.isTemplate, true),
        ),
      )
      .limit(1);
    if (existing.length > 0) continue;

    const content = htmlToText(tpl.bodyHtml);
    await db.insert(documents).values({
      organisationId: org.id,
      createdBy: systemUser.id,
      title: tpl.name,
      type: tpl.type,
      status: "FINAL",
      isTemplate: true,
      content,
      contentHtml: tpl.bodyHtml,
      jurisdiction: tpl.jurisdiction,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      metadata: { category: tpl.category, official: true },
    });
    inserted += 1;
  }

  // eslint-disable-next-line no-console
  console.log(
    `Template seed complete. Inserted ${inserted} new template(s); ${TEMPLATES.length - inserted} already present.`,
  );
  process.exit(0);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Template seed failed:", error);
  process.exit(1);
});
