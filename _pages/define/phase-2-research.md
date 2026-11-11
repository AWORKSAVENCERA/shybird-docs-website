---
title: "Phase 2: Research"
parent: How the module roadmap works
grand_parent: Shybird Define
nav_order: 2
permalink: /define/modules/research
description: Shybird Define Modules 3 to 9 - build the synthetic panel, analyse UK and international labour market evidence, and generate KSBs from job data.
---

Phase 2 builds your evidence base.

- Module 3 creates the synthetic expert panel.
- Modules 4 to 6 gather and synthesise government and international labour-market evidence.
- Modules 7 to 9 mine live job adverts and occupational profiles to produce your qualification's KSB list.

The panel reviews the results throughout. The steps run as background jobs, so you start them and then let them work.

## Module 3: Synthetic Panel Generation

### What Module 3 does

Module 3 builds a sector-specific panel of synthetic 'experts' that every later module uses to quality-assure generated output. You shape the panel by editing its composition, which gives you control over the level of assurance.

### How to complete Module 3

Module 3 has three fields: panel composition, fixed floors and panel size.

1. In the **panel composition** field, set the percentage target you want for each item. Use the arrow buttons or type a value.
   - Each item shows its allowed values. Values outside that range aren't accepted, and neither are decimals. A value that isn't accepted is rounded to the nearest acceptable value.
   - If your sector is highly regulated, switch on **Highly regulated sector**. This raises the regulatory-experience floor.
2. Check the read-only **Fixed Floors** card. It shows constraints you can't change.
3. Set the **panel size** using the arrows or by typing a value. The minimum is 10 and the maximum is 1,000.
4. When you're happy with all three fields, select **Generate Panel**. Generation takes about 15 to 40 seconds, and a progress screen shows the steps being taken.

When generation finishes, a dashboard summarises the composition mix and lists each panel member. You can then change the panel:

- To generate one panellist again from scratch, select their refresh button.
- To edit a panellist's fields, select their pencil button.
- To delete a panellist, select their trash icon.
- To start the whole process again, select **Regenerate Panel** in the top right.

Your changes are reflected in the dashboard. If the panel breaches a constraint, a violations banner appears. You must resolve it before you can approve the module.

### How to continue from Module 3

Resolve any constraint violations. When you're happy with the panel, select **Approve and Continue to Module 4**.

## Module 4: Government Data Landscape Analysis

### What Module 4 does

Module 4 pulls UK government labour-market evidence, identifies the trends that matter to your topic and groups the findings into themes. It then asks your panel of AI-simulated people what they think of those themes.

It runs in three phases:

- **Phase A** - fetch and score.
- **Phase B** - thematic clustering.
- **Phase C** - panel review.

### How to complete Module 4

Select **Start Phase A** to begin. No data is fetched until you do. As each phase progresses, timestamps for its key stages appear at the top of the page.

1. **Phase A** takes around 2 minutes. Shybird Define searches GOV.UK for relevant datasets and pulls out trends for scoring. When it finishes, it shows the number of datasets identified, surviving trends and surviving themes. You can select **Re-run Phase A** if you want to.
2. Review Phase A's trends, listed under **Trends**.
   - If very little government data covers this occupation, a warning appears above the trends. Consider whether the occupation is meaningful, or whether to widen the perimeters in earlier modules.
   - In the Trends table you can review the trends, filter them ('All', 'Selected' or 'Blocked') and select the ones to keep.
   - Select a score to see its breakdown by criterion.
   - You can override the threshold and force-include trends that scored below it.
3. **Phase B** begins when you select **Cluster trends into themes**. Review the list of themes and tick the ones to include. The themes appear under the trends section, and a message at the top of the page confirms Phase B is complete.
4. **Phase C** begins when you select **Run panel review**. Each theme then shows an approved or flagged pill, and expert feedback you can expand, from the panellists you created in Module 3.
   - You can select rejected themes and regenerate them in a batch using the panel's feedback. The output appears under each theme.
   - For each theme you can switch between the expert feedback and its lineage.
   - Select **See All** on a theme to read each panellist's review in more detail.

### How to continue from Module 4

Every selected theme must have been reviewed by the panel. When you're happy with the themes, select **Approve and Continue to Module 5**.

## Module 5: LMI (Labour Market Intelligence) Landscape Analysis

### What Module 5 does

Module 5 pulls data in a similar way to Module 4, but focuses on international markets that outrank the UK on business enterprise research and development (BERD), patents and trade. Shybird Define first identifies up to three foreign 'lead markets' that outrank the UK, then pulls and clusters evidence for each.

### How to complete Module 5

1. Review the proposed taxonomy codes in the first field. The large language model (LLM) fills these in automatically, using four classifications: ISIC, HS, EBOPS and IPC.
   - Edit the codes as needed. You need at least one ISIC code and one IPC code to continue.
   - Alternatively, select **Re-infer** to have the LLM fill in the values again.
   - When you're happy, select **Save Codes**.
2. Select **Start lead-market selection**. Countries are scored on research and development (R&D) intensity, patent activity and trade advantage. Timestamps appear under the progress bar as the calculation runs.
3. The lead markets appear in a new field, which ranks countries by their scores against each taxonomy code. The UK is shown as a baseline you can't select. Use the selector button against each qualifying market to choose which to include in later trend generation. You can select up to three.

   If no country beats the UK, Module 5 completes with no international themes, and Module 6 uses only the government themes.
4. When you're happy with the list of lead markets, select **Fetch trends**. A progress bar with timestamps appears, and the same Phase A, Phase B and Phase C flow runs as in [Module 4](#module-4-government-data-landscape-analysis). Follow those steps again.

### How to continue from Module 5

Every selected theme must have been reviewed by the panel. When you're happy with the themes, select **Approve and Continue to Module 6**.

## Module 6: Synthesis of Gov + LMI Themes

### What Module 6 does

By now Shybird Define has gathered trends from national and international markets separately. Module 6 combines them into a single set of themes for qualification design, with duplicates removed.

### How to complete Module 6

1. Select **Merge Themes**. A progress bar with timestamps appears. 'Merge Complete' shows when it's finished, and the combined themes appear below for your review. To run the merge again, select **Re-merge Themes**.
2. Review the themes. Use the selector button against each one to choose whether it's included in the panel review.
3. Select **Run panel review**. A progress bar with timestamps appears, followed by the same panel feedback fields as in Modules 4 and 5, which work in the same way.

### How to continue from Module 6

Every selected theme must have been reviewed by the panel. When you're happy with the themes, select **Approve and Continue to Module 7**.

## Module 7: KSB generation from job ads

### What Module 7 does

Module 7 pulls live UK job adverts for your chosen job title, turns them into candidate KSB statements, and has the panel review each one. The data comes from Lightcast, a labour-market database.

### How to complete Module 7

1. Fill in the **Fetch job ads from Lightcast** field. It has three settings you can edit:
   - **Job Title** - filled in from your perimeter.
   - **Years Back** - select the downward arrow to choose 3, 5 or 10 years.
   - **Target Ad Count** - 1,000 by default, up to a maximum of 10,000.
2. Select **Fetch from Lightcast**. A progress bar with timestamps appears. The fetch can take several minutes, and you can stop it by selecting **Cancel**.
3. When the fetch is complete, a second progress bar appears automatically. KSB generation runs through four stages: extract, cluster, generate and panel prep. When it finishes, the KSBs appear below it. You'll see stat cards for the total number of KSBs, the split between knowledge, skills and behaviours, and the panel's approved and flagged counts. Use the buttons to filter between knowledge, skills and behaviours.
4. Select **Run panel review**. Each KSB then shows an approved or flagged verdict. Use the filter buttons to switch between approved and flagged KSBs.
5. Expand flagged rows to read the reviewers' concerns, and delete any flagged KSB you don't want to carry forward:
   - Flagged KSBs show a trash icon. Select it to delete the KSB.
   - To delete several KSBs, including approved ones, select the **Select** button above the KSBs, choose the KSBs, then select **Delete All** at the bottom of the screen.

To generate the KSBs and their approval again, select **Fetch from Lightcast**, **Re-run panel review** or **Re-generate KSBs**.

### How to continue from Module 7

When you're happy with the review of KSBs, select **Approve and Continue to Module 8**. If any flagged KSBs remain, a pop-up asks whether you still want to approve before moving to Module 8.

## Module 8: Data Analysis: Job Profiles

### What Module 8 does

Module 8 reviews job profiles in the same way Module 7 handled job adverts, but works from Lightcast occupational profiles. In this module, panel validation runs automatically after generation.

### How to complete Module 8

1. Fill in the **Fetch profiles from Lightcast** field:
   - Select your job title.
   - Set the target ad count, using the selector arrows or by typing a number. It must be at least 1 and no more than 10,000. This number sets the target for UK ads. Each identified lead market adds a further 250 ads to the target.
   - Before you fetch the profiles, you can preview the canonical titles, which are similar job titles with a score showing their relevance. Select the ones you want to include in the analysis.
2. Select **Fetch profiles**. A progress bar with timestamps appears, and generation and panel validation run automatically.
3. Review and delete flagged KSBs as in [Module 7](#module-7-ksb-generation-from-job-ads). You can re-run the panel or generate the KSBs again.

### How to continue from Module 8

You must keep at least one KSB in each of knowledge, skills and behaviours. When you're happy with the review of KSBs, select **Approve and Continue to Module 9**.

## Module 9: Synthesis of Job Ads and Job Profiles

### What Module 9 does

By now Shybird Define has found KSBs separately from job adverts and job profiles. Module 9 combines them into one list with duplicates removed, then prioritises the KSBs listed in your design rules and business case.

### How to complete Module 9

1. Select **KSB Synthesis**. A progress bar with timestamps appears. This can take a few minutes.
2. Review the final list of KSBs, which appears when the process is complete. As in earlier modules, you can filter between knowledge, skills and behaviours.
3. Make any changes. This is the screen where you can edit KSBs the most:
   - To add a KSB, type your statement in the **Add Knowledge / Skills / Behaviours Statement** field and select **+ Add**.
   - To edit a statement, select its pencil icon, make your change, then select **Save**.
   - To delete a KSB, select its trash icon. You can undo this by selecting the refresh icon after deleting.

To restart the process, select **Re-run decision** in the top right.

### What do the provenance badges mean?

Every KSB carries a provenance badge that tells you where it came from:

| Badge | Where the KSB came from |
| --- | --- |
| BC | Business case |
| AD | Job ads |
| PROF | Profiles |
| AD+PROF | Merged from job ads and profiles |
| PRESCRIBED | Mandated by your design rules |
| MANUAL | Added by you |

### How to continue from Module 9

At least one knowledge, one skill and one behaviour statement must remain. When you're happy with the review of KSBs, select **Approve and Continue to Module 10**.
