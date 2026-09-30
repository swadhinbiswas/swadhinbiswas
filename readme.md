<!-- TODAY:START -->
<p align="center">
<img src="https://raw.githubusercontent.com/swadhinbiswas/swadhinbiswas/main/hero.svg" width="100%" alt="Swadhin Biswas - live GitHub dashboard"/>
</p>

<p align="center">
<img src="https://raw.githubusercontent.com/swadhinbiswas/swadhinbiswas/main/contribs.svg" width="100%" alt="Swadhin Biswas - contributions this year"/>
</p>

<p align="center">
<img src="https://komarev.com/ghpvc/?username=swadhinbiswas&label=profile+views&color=0d1117&style=for-the-badge" alt="profile views - live counter"/>
</p>

<!-- the badge above is real time: komarev increments it on every view.
     the hero and contribution SVGs refresh hourly via github actions. -->

<!-- TODAY:END -->

<!--
  one line a recruiter can filter on. hero.svg already carries the name,
  the role, the stack and Dhaka / EU / available - so this block only
  adds seniority, target countries and the sponsorship answer.
-->
<p align="center">
  <b>Open to mid-level Data Engineer, Backend Engineer, and Analytics Engineer roles</b><br>
  available immediately · Dhaka, Bangladesh → relocating to <b>Germany · Netherlands · Austria</b>, or remote across the EU · needs visa sponsorship
</p>

<p align="center">
  <a href="https://www.swadhin.cv/cv"><b>CV</b></a> ·
  <a href="https://swadhin.cv"><b>Portfolio</b></a> ·
  <a href="https://cal.com/swadhinbiswas"><b>Book a call</b></a> ·
  <a href="mailto:swadhinbiswas.dev@gmail.com"><b>Email</b></a> ·
  <a href="https://www.linkedin.com/in/swadhinbiswas">LinkedIn</a> ·
  <a href="https://x.com/swadhin_sh">X</a> ·
  <a href="https://blog.swadhin.cv">Blog</a>
</p>

### About

I build streaming pipelines, lakehouses, and the services around them. Five years in, mostly Python, Go, and SQL — and I like the unglamorous parts: Kafka ingestion, dbt warehouses on DuckDB, GDPR erasure, and schema-contract gates in CI.

Right now I maintain [OpencodeHub](https://github.com/swadhinbiswas/OpencodeHub), a self-hosted Git platform with CI and merge queues, and [AegisVision](https://github.com/swadhinbiswas/AegisVision), a multi-camera AI surveillance system. My latest research is [Aurora](https://github.com/swadhinbiswas/Aurora), a modular reasoning architecture with a JOSS paper.

**Languages:** English (professional, daily working language) · Bengali (native) · Hindi (conversational) · German (learning)

### Track record

| **1M+** | **10K+** | **&lt;100 ms** | **40%** | **668** | **3** |
|:--:|:--:|:--:|:--:|:--:|:--:|
| users reached | requests / minute | API latency | faster page loads | tests in one repo | papers & datasets |

<!--
  experience - EDIT BY HAND. today.py never touches this block.
  Newest first, one result-driven line per role. Keep the numbers honest
  and in sync with swadhin.cv/cv. Education is the grey line at the bottom
  because it is a filter, not a highlight.
-->
<!-- EXPERIENCE:START -->
### Experience

**May 2026 to now · Founder and maintainer · [OpencodeHub](https://github.com/swadhinbiswas/OpencodeHub)**
I build and maintain this end to end: SSH access, CI pipelines, stacked PRs, merge queues, AI-assisted code review. Go and TypeScript, **668 tests**, full end-to-end coverage.

**2026 to now · Builder · [AegisVision](https://github.com/swadhinbiswas/AegisVision)**
Multi-camera AI surveillance and behavioural monitoring that runs on ordinary hardware: real-time face recognition with anti-spoofing liveness checks. Python.

**January 2023 to November 2025 · Co-Founder and Lead Data/Backend Engineer · The Boring Rat** *(acquired 2025, under NDA)*
Took the backend from zero to **1M+ users** as co-founder and lead engineer: real-time event ingestion, the analytics warehouse, MLOps workflows, and the on-call. Python, FastAPI, PostgreSQL, Redis, Docker, AWS — REST APIs at **10K+ requests per minute under 100 ms**.

**January 2021 to December 2022 · Freelance backend and automation engineer**
Delivered **8+** production systems end to end for US and UK SaaS and e-commerce clients — requirements, delivery, support. Django and PostgreSQL APIs handled 10K+ requests a day, and I cut page load times by **40%**.

<sub>B.Sc. Computer Science and Engineering, Daffodil International University, Dhaka · 2022 – 2026 · data structures, algorithms, database systems, machine learning, software engineering</sub>

<!-- EXPERIENCE:END -->

<!--
  featured projects - EDIT BY HAND. today.py never touches this block.
  Six only, one number each. OpencodeHub and AegisVision are deliberately
  absent: they are current roles, so they already sit in Experience.
-->
<!-- FEATURED:START -->
### Featured projects

- **[eu-air-traffic](https://www.swadhin.cv/projects/eu-air-traffic/)** — live EU airspace pipeline on Kafka, dbt, and DuckDB. Tracks ~2,000 aircraft with a 15-minute lake, published as a public Hugging Face dataset and a [Zenodo DOI](https://doi.org/10.5281/zenodo.22790201).
- **[TerraSentinel](https://www.swadhin.cv/projects/terrasentinel/)** — $0 anomaly detection over free satellite and sensor data. Four public sources into a versioned lake, dbt and DuckDB build seven gold marts, an IsolationForest scores the anomalies, and a Databricks Asset Bundle mirrors the whole pipeline.
- **[eurostream](https://www.swadhin.cv/projects/eurostream/)** — GDPR-native streaming lakehouse. Six-layer Article 17 erasure runs in **66.95 ms mean** against a 60-second statutory window. Kafka, DuckDB, Turso.
- **[JustAPI](https://www.swadhin.cv/projects/justapi/)** — Python web framework with a Rust core. **766k req/s** hello-world, **0.48 ms p99**, 12 MB footprint, on PyPI.
- **[Aurora](https://www.swadhin.cv/projects/aurora/)** — modular reasoning architecture with a [JOSS paper](https://doi.org/10.5281/zenodo.22067754). GSM8K accuracy **47.2% → 55.6%**, confidently wrong answers **19.8% → 2.9%**.
- **[opengrammar](https://www.swadhin.cv/projects/opengrammar/)** — privacy-first Grammarly alternative. 156k-word offline engine, five runtimes, 124 stars.

<sub>Case studies and architecture notes: [swadhin.cv/projects](https://swadhin.cv/projects)</sub>

<!-- FEATURED:END -->

### Research

- **[A Unified Denoising and Adaptation Framework for Self-Supervised Bengali Dialectal ASR](https://arxiv.org/abs/2509.00988)** — first author, with Imran and Tuhin Sheikh. [arXiv:2509.00988](https://arxiv.org/abs/2509.00988) · [PDF](https://arxiv.org/pdf/2509.00988)
  WavLM with two-stage fine-tuning, tested from clean audio down to low signal-to-noise ratios; beats fine-tuned wav2vec 2.0 and multilingual Whisper.
- **[Aurora (ART): A Modular Reasoning Architecture for Reliable and Efficient Neural Systems](https://github.com/swadhinbiswas/Aurora/blob/main/paper/paper.md)** — lead author. [paper](https://github.com/swadhinbiswas/Aurora/blob/main/paper/paper.md) · [DOI](https://doi.org/10.5281/zenodo.22067754)
  Six-stage transformer with an explicit uncertainty channel, published in JOSS.
- **[An Empirical Benchmark Dataset for Paillier-Based Privacy-Preserving REST API Gateways](https://doi.org/10.5281/zenodo.18655966)** — [Zenodo DOI](https://doi.org/10.5281/zenodo.18655966)
  Per-request telemetry benchmark for homomorphic-encryption overhead in REST gateways.

<sub>Full list with abstracts: [swadhin.cv/research](https://swadhin.cv/research)</sub>

<!--
  stack - text keyword lines + link to the full visual wall on the site.
  Edit by hand. The icon wall lives at swadhin.cv/skills now.
-->
<!-- STACK:START -->
### Stack

**Core:** Python · Go · Rust · TypeScript · SQL · Kafka · Spark · Databricks · Airflow · dbt · DuckDB · PostgreSQL · Redis · FastAPI · Django · Docker · AWS (Glue, Redshift, Athena) · Azure (Data Factory) · GCP (Dataflow, Dataproc) · PyTorch

**Working knowledge:** ClickHouse · Kubernetes · Terraform · Airbyte · Dagster · Prometheus · LangChain · OpenAI / local LLM APIs

<p align="center">
  <sub>Data engineering · Cloud · Databases · AI · Backend · <a href="https://swadhin.cv/skills">full stack</a></sub>
</p>

<!-- STACK:END -->

<!--
  writing - EDIT BY HAND, or let today.py refresh it from the blog RSS feed.
  the WRITING block is replaced automatically on every run; the list below
  is the fallback used when the feed is unreachable. the intro sentence is
  generated too, so never repeat it in the About section above.
-->
<!-- WRITING:START -->
### Writing

I write about backend systems, data engineering, and building software from scratch on my blog, [blog.swadhin.cv](https://blog.swadhin.cv).

- **[OpenCode wrote 125,000 loose Git objects into my home directory and never committed once](https://blog.swadhin.cv/blog/opencode-btrfs-metadata-exhaustion/)** · 28 Sep 2026
- **[Designing data pipelines that stay cheap](https://blog.swadhin.cv/blog/designing-data-pipelines-that-stay-cheap/)** · 24 Sep 2026
- **[Designing an API for 100,000 requests a second](https://blog.swadhin.cv/blog/designing-an-api-for-100000-requests-a-second/)** · 24 Sep 2026
- **[Flare: self-hosted webmail for my own domain](https://blog.swadhin.cv/blog/flare-self-hosted-webmail/)** · 21 Sep 2026

<sub>More at [blog.swadhin.cv](https://blog.swadhin.cv) · [RSS](https://blog.swadhin.cv/rss.xml) · [Atom](https://blog.swadhin.cv/atom.xml)</sub>
<!-- WRITING:END -->

<!--
  projects - auto-generated from the PROJECTS list in today.py.

  to add a project by hand, append one tuple to the matching category:
      ("repo-name", "short tagline")
  or, for a custom link target:
      ("display Name", "tagline", "https://example.com")
  the repository link, alignment and layout are regenerated
  automatically on the next run.
-->

<!-- PROJECTS:START -->
<details>
<summary><b>More projects — all 26 repositories</b></summary>

<pre>
DATA ENGINEERING                                RESEARCH                                        
  <a href="https://github.com/swadhinbiswas/eu-air-traffic">eu-air-traffic</a> live EU airspace pipeline        <a href="https://github.com/swadhinbiswas/contexa">contexa</a>        versioned llm agent memory     
  <a href="https://github.com/swadhinbiswas/TerraSentinel">TerraSentinel</a>  databricks satellite anomaly     <a href="https://github.com/swadhinbiswas/DOOMSDAYCS">DOOMSDAYCS</a>     offline cs encyclopedia        
  <a href="https://github.com/swadhinbiswas/eurostream">eurostream</a>     gdpr-native streaming lakehouse  <a href="https://github.com/swadhinbiswas/FAANG-Playbook">FAANG-Playbook</a> 1,400+ leetcode problems       
                                                                                                
DEVOPS                                          TOOLS                                           
  <a href="https://github.com/swadhinbiswas/OpencodeHub">OpencodeHub</a>    git platform w/ ci pipelines     <a href="https://github.com/swadhinbiswas/veet">veet</a>           universal app uninstaller      
  <a href="https://github.com/swadhinbiswas/gvx">gvx</a>            the pnpm of python               <a href="https://github.com/swadhinbiswas/lsf">lsf</a>            ls with nerd-font icons        
  <a href="https://github.com/swadhinbiswas/HiFiLinux">HiFiLinux</a>      audiophile audio for linux       <a href="https://github.com/swadhinbiswas/fetchx">fetchx</a>         neofetch rewritten in rust     
                                                  <a href="https://github.com/swadhinbiswas/Ghost">Ghost</a>          free &amp; open coding tool    
BACKEND                                           <a href="https://github.com/swadhinbiswas/ZenDownload">ZenDownload</a>    download anything, one place   
  <a href="https://github.com/swadhinbiswas/JustAPI">JustAPI</a>        zero-copy rust web framework     <a href="https://github.com/swadhinbiswas/vscode-android">vscode-android</a> a real ide for android         
                                                  <a href="https://github.com/swadhinbiswas/warren">warren</a>         rootless cli runtime           
MACHINE-LEARNING                                                                                
  <a href="https://github.com/swadhinbiswas/Aurora">Aurora</a>         modular reasoning architecture OTHERS                                          
  <a href="https://github.com/swadhinbiswas/AegisVision">AegisVision</a>    multi-camera ai surveillance     <a href="https://github.com/swadhinbiswas/linuxy">linuxy</a>         one-click appimage runner      
  <a href="https://github.com/swadhinbiswas/Ecoguard">Ecoguard</a>       self-hosted llm inference gw     <a href="https://github.com/swadhinbiswas/de-omarchy">de-omarchy</a>     modern desktop, no omarchy     
  <a href="https://github.com/swadhinbiswas/opengrammar">opengrammar</a>    open-source grammarly alt        <a href="https://github.com/swadhinbiswas/Mervelas">Mervelas</a>       ai coding cli built on bun     
                                                  <a href="https://github.com/swadhinbiswas/VidoLib">VidoLib</a>        lag-free media engine          
                                                  <a href="https://github.com/swadhinbiswas/moonshell">moonshell</a>      personal qml linux rice        
</pre>

</details>
<!-- PROJECTS:END -->

<!--
  footer - hand-edited; today.py never touches anything below the
  PROJECTS block. the last thing on the page is the ask, not a contact
  list: the nav bar at the top already carries every hire-me link.
-->
<p align="center">
  <b>Looking for a Data or Backend role in Germany, the Netherlands, or Austria?</b><br>
  <a href="https://cal.com/swadhinbiswas"><b>Book a 20-minute call</b></a> · <a href="https://www.swadhin.cv/cv">Read the CV</a> ·
  <a href="mailto:swadhinbiswas.dev@gmail.com">swadhinbiswas.dev@gmail.com</a>
</p>

<p align="center">
  <sub>
    <a href="https://www.linkedin.com/in/swadhinbiswas">LinkedIn</a> ·
    <a href="https://x.com/swadhin_sh">X</a> ·
    <a href="https://www.youtube.com/@BitsWar">YouTube @BitsWar</a> ·
    <a href="https://blog.swadhin.cv/rss.xml">RSS</a>
  </sub>
</p>

<p align="center">
  <em>off the clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg> street-food hunter · <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg> anime marathoner · <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Mystery & mythology story hunter</em>
</p>
