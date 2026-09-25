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

<p align="center">
  <a href="https://swadhin.cv"><b>Portfolio</b></a> ·
  <a href="https://blog.swadhin.cv"><b>Blog</b></a> ·
  <a href="https://www.swadhin.cv/cv"><b>CV</b></a> ·
  <a href="https://cal.com/swadhinbiswas"><b>Book a call</b></a> ·
  <a href="mailto:swadhinbiswas.dev@gmail.com">Email</a> ·
  <a href="https://www.linkedin.com/in/swadhinbiswas">LinkedIn</a> ·
  <a href="https://x.com/swadhin_sh">X</a>
</p>

### At a glance

- **Roles:** Data Engineer, Backend Engineer, or Analytics Engineer (mid-level)
- **Experience:** 5 years in software since 2021, 3+ of them on production data and backend systems
- **Focus:** streaming pipelines, lakehouses, GDPR erasure, CI quality gates
- **Location:** Dhaka, Bangladesh; ready to relocate to Germany, the Netherlands, or Austria, or work remotely across the EU
- **Visa:** needs sponsorship · **Availability:** immediate
- **Education:** B.Sc. Computer Science and Engineering, Daffodil International University, April 2022 to July 2026
- **Core stack:** Python, Go, Rust, Kafka, Spark, Databricks, dbt, DuckDB, PostgreSQL, Docker, AWS, Azure and GCP

### About

I build streaming pipelines, lakehouses, and the services around them. Most of my work is in Python, Go, and TypeScript, and I like the unglamorous parts: Kafka ingestion, dbt warehouses on DuckDB, GDPR erasure, and schema-contract gates in CI.

Right now I'm building [OpencodeHub](https://github.com/swadhinbiswas/OpencodeHub), a self-hosted Git platform with CI and merge queues, and [AegisVision](https://github.com/swadhinbiswas/AegisVision), a multi-camera AI surveillance system. My latest research is [Aurora](https://github.com/swadhinbiswas/Aurora), a modular reasoning architecture with a JOSS paper.

I write about backend systems, data engineering, and building software from scratch on my blog, [blog.swadhin.cv](https://blog.swadhin.cv).

**Languages:** English (professional, daily working language) · Bengali (native) · Hindi (conversational) · German (learning).

**Email:** [swadhinbiswas.dev@gmail.com](mailto:swadhinbiswas.dev@gmail.com) · [swadhinbiswas.cse@gmail.com](mailto:swadhinbiswas.cse@gmail.com) · [eu@swadhin.cv](mailto:eu@swadhin.cv)

### Highlights

- Co-founded The Boring Rat and grew it to **1M+ users** on a Python, FastAPI, and PostgreSQL backend that served **10K+ requests per minute at under 100 ms**. The company was **acquired under NDA in 2025**.
- Published a **JOSS paper** and archived DOI for [Aurora](https://doi.org/10.5281/zenodo.22067754): GSM8K accuracy rose from 47.2% to 55.6% while confidently wrong answers fell from 19.8% to 2.9%.
- First author on an [arXiv paper](https://arxiv.org/abs/2509.00988) on noise-robust Bengali dialectal speech recognition.
- I maintain open-source projects with public releases and datasets, including [opengrammar](https://github.com/swadhinbiswas/opengrammar) at 124 stars and [OpencodeHub](https://github.com/swadhinbiswas/OpencodeHub) with 668 tests.

<!--
  experience - EDIT BY HAND. today.py never touches this block.
  Newest first, one result-driven line per role. Keep the numbers honest
  and in sync with swadhin.cv/cv.
-->
<!-- EXPERIENCE:START -->
### Experience

**May 2026 to now · Founder and maintainer · [OpencodeHub](https://github.com/swadhinbiswas/OpencodeHub)**
I build and maintain a free self-hosted Git platform with SSH access, CI pipelines, stacked PRs, merge queues, and AI-assisted code review. Go and TypeScript, 668 tests, end-to-end coverage.

**2026 to now · Builder · [AegisVision](https://github.com/swadhinbiswas/AegisVision)**
A multi-camera AI surveillance and behavioural monitoring system that runs on ordinary hardware. It does real-time face recognition with anti-spoofing liveness checks. Python.

**January 2023 to November 2025 · Co-Founder and Lead Data/Backend Engineer · The Boring Rat** *(acquired, under NDA)*
I owned the backend architecture from the first version to 1M+ users: real-time event ingestion, the analytics warehouse, and MLOps workflows. Python, FastAPI, PostgreSQL, Redis, Docker, and AWS. Our REST APIs served 10K+ requests per minute at under 100 ms.

**January 2021 to December 2022 · Freelance backend and automation engineer**
I shipped 8+ custom software solutions for international clients, primarily SaaS and e-commerce teams in the US and UK. The Django and PostgreSQL APIs handled 10K+ requests a day, and I cut page load times by 40%.

<!-- EXPERIENCE:END -->

### Education

**B.Sc. in Computer Science and Engineering**, Daffodil International University, Dhaka. April 2022 to July 2026.
Coursework: data structures, algorithms, database systems, machine learning, and software engineering.

<!--
  featured projects - EDIT BY HAND. today.py never touches this block.
  One bullet per project: link the name to its case study, then a short
  line with the numbers. Keep it in sync with swadhin.cv/projects.
-->
<!-- FEATURED:START -->
### Featured projects

- **[eu-air-traffic](https://www.swadhin.cv/projects/eu-air-traffic/)**: live EU airspace pipeline on Kafka, dbt, and DuckDB. Tracks about 2,000 aircraft with a 15-minute lake, and ships a public Hugging Face dataset and a [Zenodo DOI](https://doi.org/10.5281/zenodo.22790201).
- **[TerraSentinel](https://www.swadhin.cv/projects/terrasentinel/)**: $0 anomaly-detection platform over free satellite and sensor data. Four public sources into a versioned lake, dbt and DuckDB build seven gold marts, an IsolationForest scores anomalies, and a Databricks Asset Bundle mirrors the whole pipeline.
- **[eurostream](https://www.swadhin.cv/projects/eurostream/)**: GDPR-native streaming lakehouse whose six-layer Article 17 erasure runs in 66.95 ms mean against a 60-second statutory window. Kafka, DuckDB, Turso.
- **[JustAPI](https://www.swadhin.cv/projects/justapi/)**: Python web framework with a Rust core. 766k req/s hello-world, a 0.48 ms p99, and a 12 MB footprint, published on PyPI.
- **[Aurora](https://www.swadhin.cv/projects/aurora/)**: modular reasoning architecture with a JOSS paper. GSM8K accuracy 47.2% to 55.6%, confident errors down to 2.9%.
- **[opengrammar](https://www.swadhin.cv/projects/opengrammar/)**: privacy-first Grammarly alternative with a 156k-word offline engine, five runtimes, and 124 stars.
- **[OpenCodeHub](https://www.swadhin.cv/projects/opencodehub/)**: self-hosted Git platform with CI, stacked PRs, merge queues, and AI review. 668 tests.
- **[AegisVision](https://www.swadhin.cv/projects/aegisvision/)**: multi-camera AI surveillance and behavioural monitoring in Python, with real-time detection.
<!-- FEATURED:END -->

<!--
writing - EDIT BY HAND, or let today.py refresh it from the blog RSS feed.
the WRITING block is replaced automatically on every run; the list below
is the fallback used when the feed is unreachable.
-->
<!-- WRITING:START -->
### Writing

I write about backend systems, data engineering, and building software from scratch on my blog, [blog.swadhin.cv](https://blog.swadhin.cv).

- **[Designing data pipelines that stay cheap](https://blog.swadhin.cv/blog/designing-data-pipelines-that-stay-cheap/)** · 24 Sep 2026
- **[Designing an API for 100,000 requests a second](https://blog.swadhin.cv/blog/designing-an-api-for-100000-requests-a-second/)** · 24 Sep 2026
- **[Flare: self-hosted webmail for my own domain](https://blog.swadhin.cv/blog/flare-self-hosted-webmail/)** · 21 Sep 2026
- **[A filesystem event log in SQLite](https://blog.swadhin.cv/blog/filesystem-event-log-in-sqlite/)** · 20 Sep 2026

<sub>More at [blog.swadhin.cv](https://blog.swadhin.cv) · [RSS](https://blog.swadhin.cv/rss.xml) · [Atom](https://blog.swadhin.cv/atom.xml)</sub>
<!-- WRITING:END -->

### Research

- **A Unified Denoising and Adaptation Framework for Self-Supervised Bengali Dialectal ASR**. First author, with Imran and Tuhin Sheikh. [arXiv:2509.00988](https://arxiv.org/abs/2509.00988) · [PDF](https://arxiv.org/pdf/2509.00988)
  WavLM-based framework with two-stage fine-tuning for noise-robust dialectal recognition. Tested across dialects from clean audio to low signal-to-noise ratios, it beats fine-tuned wav2vec 2.0 and multilingual Whisper.
- **Aurora (ART): A Modular Reasoning Architecture for Reliable and Efficient Neural Systems**. Lead author. [paper](https://github.com/swadhinbiswas/Aurora/blob/main/paper/paper.md) · [DOI](https://doi.org/10.5281/zenodo.22067754)
  Six-stage transformer with an explicit uncertainty channel: GSM8K 47.2% → 55.6%, confidently wrong answers 19.8% → 2.9%.
- **An Empirical Benchmark Dataset for Paillier-Based Privacy-Preserving REST API Gateways**. [Zenodo DOI](https://doi.org/10.5281/zenodo.18655966)
  Per-request telemetry benchmark for homomorphic encryption overhead in REST API gateways.

Full list with abstracts: [swadhin.cv/research](https://swadhin.cv/research)

<!--
  projects - auto-generated from the PROJECTS list in today.py.

  to add a project by hand, append one tuple to the matching category:
      ("repo-name", "short tagline")
  or, for a custom link target:
      ("display Name", "tagline", "https://example.com")
  the repository link, alignment and layout are regenerated
  automatically on the next run.
-->

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

<!-- PROJECTS:START -->
### More projects

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
<!-- PROJECTS:END -->

<p align="center">
  <sub>Case studies for the featured work: <a href="https://swadhin.cv/projects">swadhin.cv/projects</a></sub>
</p>

<!--
  socials - hand-edited; today.py never touches anything below the
  PROJECTS block. swap any href freely.
-->

### Connect

- Portfolio: [swadhin.cv](https://swadhin.cv)
- Blog: [blog.swadhin.cv](https://blog.swadhin.cv) · [RSS](https://blog.swadhin.cv/rss.xml)
- CV (printable): [swadhin.cv/cv](https://www.swadhin.cv/cv)
- Book a call: [cal.com/swadhinbiswas](https://cal.com/swadhinbiswas)
- LinkedIn: [@swadhinbiswas](https://www.linkedin.com/in/swadhinbiswas)
- Email: [swadhinbiswas.dev@gmail.com](mailto:swadhinbiswas.dev@gmail.com) · [swadhinbiswas.cse@gmail.com](mailto:swadhinbiswas.cse@gmail.com) · [eu@swadhin.cv](mailto:eu@swadhin.cv)
- X: [@swadhin_sh](https://x.com/swadhin_sh)
- YouTube: [@BitsWar](https://www.youtube.com/@BitsWar)

<p align="center">
  <em>off the clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg> street-food hunter · <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg> anime marathoner · <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Mystery & mythology story hunter</em>
</p>
