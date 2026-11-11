---
title: Key concepts in Shybird Define
parent: Shybird Define
nav_order: 2
permalink: /define/key-concepts
description: The ideas behind Shybird Define - projects, modules, the module roadmap, sequential gating, the synthetic expert panel, background jobs and re-runs.
---

A few ideas recur throughout Shybird Define. Understanding them once makes the rest of this guide easier to follow. Later pages explain how each one works in more detail.

## What is the Shybird AI assistant?

Shybird Define has a built-in learning assistant, called 'Shybird AI', that you can use throughout your work. It can explain what is happening in your project and guide you through each module.

To open it, select the orange button in the top right of any screen. A chat window opens. If you have any problems during your project, ask the assistant first.

## What are projects and modules?

Shybird Define works in projects, and each project is structured into modules.

- A **project** is one qualification you're building.
- Each project runs through 19 numbered **modules** (0 to 18), grouped into five phases. You complete them in order, from Module 0 to Module 18.

See [How the module roadmap works]({% link _pages/define/module-roadmap.md %}) for the list of phases and modules.

## What is the module roadmap?

The module roadmap shows every module in your project. Use it to see the progress of each module and to open any module during your project.

To open the module roadmap while you're in a module, select **Module Roadmap** in the top right corner.

## Can I skip a module?

No. Shybird Define uses sequential gating: each module unlocks only when the one before it is complete. On the module roadmap, each module shows one of three states:

| State | Colour | Meaning |
| --- | --- | --- |
| Completed | Teal | You've approved the output of this module. You can still revisit it. |
| In progress | Amber | The step you're currently on. |
| Locked | Grey | Not yet available. Finish the earlier steps first. |

## How do I complete a module?

Shybird Define keeps you in the lead, so you only move to the next module when you approve the current one.

At the bottom of each module there's an **Approve and Continue to Module N** button. It stays disabled until the module's minimum requirements are met. When you select it, Shybird Define saves your work, moves you on to the next module and marks the module you approved as completed (teal) on the module roadmap.

## What is the synthetic expert panel?

The synthetic panel is Shybird Define's quality control. It's a set of AI-generated subject-matter 'experts' that you create in Module 3. In later modules the panel reviews the AI's output.

For each review, every panellist returns a verdict with written feedback, a background, a confidence score and a vote weight. Wherever you see 'Panel feedback' or reviewer cards, that's the panel at work. Each verdict is one of two states:

| Verdict | Meaning |
| --- | --- |
| Approved | The panellist approves the output. |
| Flagged | The panellist has flagged issues with the output. |

## Why do some steps take a while?

The heavier steps, such as research, generation and scoring, run as background jobs. While a job runs you see a progress bar with named stages and a note that it's safe to leave the page and come back. Progress is saved on the server, and the page updates itself as the job goes on.

## Can I re-run a module I've finished?

Yes. You can revisit any completed module, but doing so resets the modules after it. Where re-run controls appear, you get two choices:

- **Reopen to edit** - keep this module's data and reset only the modules after it.
- **Re-run fresh** - discard this module's data and everything after it. You'll be asked to confirm.
