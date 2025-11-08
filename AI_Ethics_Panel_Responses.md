# AI Ethics & Equity Panel - Cylton Collymore Response Guide
**Stillman College AI Ethics Panel**  
**Date: [Panel Date]**  
**Panelist: Cylton Collymore, Founder & CEO, Sirsi Technologies**

---

## **Brief Personal Introduction**

"Good afternoon. I'm Cylton Collymore, Founder and CEO of Sirsi Technologies. I've spent 20+ years building and securing infrastructure at the highest levels—from protecting the US Passport database to founding Zimbali Networks, which raised $1M from Techstars, Visa, and Hedera. I built Sirsi because infrastructure complexity has become a barrier that excludes Black and Brown entrepreneurs from bringing their dreams to life, and I've lived that pain at scale. Sirsi exists to democratize infrastructure through conversational AI, built on a principle I've lived by my entire life: minimize harm, especially to the vulnerable."

---

## **Opening Question (3:08 PM): What does ethical AI mean in practice?**

"Ethical AI means building systems that serve people—not just data points. At Sirsi, we're creating the world's first generative AI infrastructure assistant, and we made a foundational decision early: our AI doesn't just automate—it *explains*. 

Here's a little-known fact: **75% of AI decisions in production can't be explained by the humans who deployed them**. That's terrifying when you're talking about infrastructure that runs hospitals or financial systems. At Sirsi, every infrastructure decision our AI makes comes with a human-readable explanation—'I chose AWS Lambda over EC2 because your traffic pattern shows 80% idle time, saving you $4,200 monthly.'

But ethical AI goes deeper than transparency. In practice, it's not just asking 'who benefits?'—it's asking **'who is harmed?'** Too many times in tech, we accept collateral damage if we determine there's 'overall good.' But there are times when the harm is pointed and devastating, and the 'it's all good' approach isn't enough. When we minimize harm—whether during building, optimizing, or scaling—that's when we can be assured our success has done the greatest good. 

Sirsi was built with that principle in mind because it's the principle I've lived by all my life."

---

## **Theme 1 (3:15 PM): Building fairness without massive budgets**

"Here's what big tech won't tell you: **ethics doesn't require a massive budget—it requires intentionality**. At Sirsi, we're bootstrapped, so we've gotten creative.

First, **diverse testing groups**. We partner with three HBCUs—including Stillman College—to have students test Sirsi's infrastructure generation. They catch bias we'd miss in a homogeneous team. For example, a student asked, 'Why does your AI assume all startups need US-East-1 AWS regions? What about African entrepreneurs?' That question didn't just lead to a feature—it led to a complete rethinking of our infrastructure model.

Second, **open-source bias tools** like IBM's AI Fairness 360 cost zero dollars. But the real game-changer? We've made these tools accessible through natural language. You don't need a PhD to ask Sirsi, 'Is this fair?'

Third, **transparency by design**—every Sirsi AI decision logs its reasoning. It's like showing your work in math class, except the stakes are someone's business infrastructure.

Here's the secret sauce: ethical AI often *performs better*. When we forced our models to explain decisions, we caught a bug where our cost optimization was recommending cheaper instances that couldn't handle peak loads. A biased AI would've tanked customer websites. Fairness saved us from a PR nightmare and improved our accuracy by 12%.

And here's what matters most: building ethically from the start is *cheaper* than retrofitting later. Companies that bolt ethics on after launch spend 10-15x more fixing problems they could have prevented."

---

## **Theme 2 (3:25 PM): Role of representation in datasets and teams**

"Representation isn't optics—it's survival. Let me share something most people don't know: **Joy Buolamwini's 2018 MIT study found facial recognition was 34% less accurate on darker-skinned women than light-skinned men**. That's not a rounding error—that's systemic failure baked into training data.

At Sirsi, we've seen this in infrastructure AI. Voice assistants don't understand Southern dialects. Natural language processing struggles with code-switching—how many Black developers naturally switch between AAVE and technical jargon? If your training data is Silicon Valley engineers, you're building AI that only understands Silicon Valley.

Here's what gets me excited: **diverse teams catch blindspots 47% faster** according to McKinsey. When we hired our first HBCU intern, they asked a question that transformed Sirsi's entire architecture: 'Does Sirsi account for African cloud infrastructure costs?' 

Turns out, AWS pricing in Lagos is 30% higher than Virginia. But here's where Sirsi's vision becomes revolutionary: instead of just optimizing for cheaper regions, we asked **'who is harmed by this centralized model?'** The answer? Everyone outside the tech hubs, especially communities and institutions built to serve us.

So we're building what we call the **HBCU Matrix**—a global data mesh that leverages the idle or excess compute and storage resources of the 101 HBCUs across the United States. These institutions represent pre-existing physical energy and water resources that can fulfill data center needs. This is a fundamental shift away from global MSPs to institutions that were built with us in mind and humanity at their center.

Think about it: instead of sending all our data to Amazon's servers in Virginia, imagine Spelman College hosting infrastructure for Black-owned businesses in Atlanta, or Tuskegee University providing compute for healthcare startups serving rural Alabama. That's not just cost optimization—that's economic empowerment and data sovereignty.

And here's the kicker: **representation in datasets matters as much as teams**. I scraped 50,000 infrastructure configurations from GitHub to train Sirsi's AI. But those configs were overwhelmingly from Fortune 500 companies. Small businesses and nonprofits were invisible. So we partnered with Code2040 and added 15,000 configurations from minority-owned startups. Now Sirsi understands that a Harlem bakery's infrastructure needs are different from Goldman Sachs. That's equity through data."

---

## **Theme 3 (3:35 PM): Rebuilding public trust in AI systems**

"Trust in AI has been shattered by very public failures. In 2019, **Apple Card gave women lower credit limits than men with identical credit scores**—even Steve Wozniak's wife got a lower limit. In 2020, a **Black man in Detroit was wrongfully arrested because facial recognition misidentified him**. These aren't edge cases—they're consequences of deploying AI without asking 'who is harmed?'

So how do we rebuild trust? **Transparency first.** At Sirsi, when our AI generates infrastructure, we show the decision tree. If you ask for a database recommendation and Sirsi says 'PostgreSQL,' you see: 'Your data is relational, you need ACID compliance, and PostgreSQL saves 40% vs Oracle.' No black box. You can challenge the AI's logic and it will explain further.

**Community oversight second.** The communities most impacted should audit these systems. Here's a fact most people don't know: **Ada Lovelace, the first computer programmer, was a woman in 1843**. Yet today, only 26% of computing jobs are held by women, and just 3% by Black women. That historical exclusion means current AI often lacks their perspectives. 

At Sirsi, we're exploring 'AI audits' similar to financial audits—third-party verification of fairness, especially for infrastructure that affects vulnerable populations. And we're building the HBCU Matrix to ensure that the institutions auditing and hosting AI infrastructure are rooted in communities that have been historically marginalized by technology.

**Accountability third.** When AI fails, a human must be responsible. Not legal gymnastics—actual accountability. In hiring, policing, healthcare—every AI decision needs a name attached to it. Someone who will answer when it goes wrong.

But here's the deeper truth: we can't rebuild trust by just being 'less bad.' We have to actively ask **'who is harmed?'** at every stage. When Sirsi optimizes infrastructure costs, we don't just celebrate savings—we ask if those savings come at the expense of small businesses who can't afford upfront costs. When we recommend cloud regions, we don't just pick the cheapest—we ask if we're perpetuating a system where wealth flows away from underserved communities.

Trust isn't built through marketing—it's built through consistently doing the right thing, admitting mistakes quickly, and fixing them faster. And most importantly, building systems where harm minimization is the foundation, not an afterthought."

---

## **Theme 4 Closing (3:45 PM): One universal principle for AI ethics**

"If I could encode one principle into every AI system, it would be: **'First, minimize harm—especially to the already vulnerable.'**

Not 'who benefits?' but **'who is harmed?'** Because here's the truth: **AI doesn't just preserve inequality—it compounds it exponentially**. There's a phenomenon called 'algorithmic amplification.' If your hiring AI has even a 2% bias against Black candidates, and it screens 100,000 applicants, that's 2,000 qualified people denied opportunity. Over 10 years, that's generational wealth lost. That's families impacted. That's communities decimated.

At Sirsi, before deploying any AI feature, we run what I call the 'harm minimization test.' We ask: 'Will this make life harder for people who are already struggling?' For example, our AI optimizes cloud costs. Obvious win, right? But our intern pointed out: 'What if a nonprofit in Detroit can't afford upfront reserved instances, even though it's cheaper long-term?' We added flexible payment recommendations for budget-constrained customers.

But we went further. We asked: 'Who is harmed when all cloud infrastructure is centralized in a few mega-corporations?' The answer: HBCUs, minority-owned businesses, underserved communities. So we're building the HBCU Matrix—transforming HBCUs into a distributed data mesh that keeps resources, wealth, and data sovereignty in communities that need them.

Here's a little-known fact: **The word 'robot' comes from the Czech word 'robota,' meaning forced labor**. That etymology should haunt us. Are we building AI to liberate or to oppress? 

The default state isn't neutral—society already has systemic biases. Water flows downhill to the lowest point unless you build channels to redirect it. If your AI isn't explicitly designed to counter existing inequalities, it will amplify them. It's physics.

My principle: the baseline is 'minimize harm.' The aspiration is AI that *uplifts*. But you can't lift if you're standing on someone's neck. That's not a nice-to-have—that's engineering ethics 101. That's how I was raised. That's how I built Sirsi. And that's the only way forward."

---

## **Quick Reference Facts for Panel**

### Personal Background
- 20+ years DevOps management at enterprise scale
- MIT xPro Full Stack Developer (2022-2023)
- Cybersecurity Architect for travel.state.gov
- Oracle Vault Lead Architect (US Passport & Visa database)
- 2x Founder: Raised $1M for Zimbali Networks (Techstars, Visa, Hedera backed)

### Sirsi Key Facts
- World's first Generative AI Infrastructure Assistant
- 88% F1-score on analytics engine
- Every AI decision includes human-readable explanation
- Partners with 3 HBCUs for diverse testing
- Alpha launch: December 1st, 2025
- 3 patents pending on AI-driven infrastructure generation
- $100K committed from early institutional investors

### HBCU Matrix Vision
- Leverages compute/storage resources from 101 HBCUs
- Distributed data mesh owned by institutions built for us
- Shifts wealth away from global MSPs to community institutions
- Provides data sovereignty for underserved communities
- Uses pre-existing infrastructure (energy, water, buildings)

### Compelling Statistics
- 75% of production AI decisions can't be explained by deployers
- Joy Buolamwini study: 34% less accuracy on darker-skinned women
- McKinsey: Diverse teams catch blindspots 47% faster
- Ada Lovelace = first programmer (1843, woman)
- Only 3% of computing jobs held by Black women today
- Etymology: "robot" = Czech "robota" (forced labor)
- Apple Card 2019: Gender bias in credit limits
- 2020: Black man wrongfully arrested via facial recognition

### Ethical Framework
**Primary Question:** "Who is harmed?"  
**Secondary Question:** "Who benefits?"  
**Principle:** Minimize harm to the vulnerable first  
**Method:** Harm minimization test before every deployment  
**Philosophy:** "You can't lift if you're standing on someone's neck"

---

## **Audience Q&A Preparation**

**Potential Questions & Talking Points:**

**Q: How do small companies afford ethical AI development?**
- Open-source tools (IBM AI Fairness 360)
- HBCU student partnerships for testing
- Building ethics early is 10-15x cheaper than retrofitting
- Transparency by design costs less than fixing PR disasters

**Q: What's one thing developers can do today?**
- Ask "who is harmed?" before deploying
- Log every AI decision with explanation
- Test with diverse users, not just your team
- Partner with HBCUs and community organizations

**Q: How is Sirsi different from AWS/Azure/GCP?**
- We explain every decision (they're black boxes)
- HBCU Matrix keeps wealth in communities
- Built from scratch with harm minimization as foundation
- Designed for entrepreneurs, not just enterprises

**Q: What role should government play?**
- Mandate explainability in high-stakes systems (hiring, policing, lending)
- Fund HBCU infrastructure investments
- Require diverse testing before deployment
- Hold humans accountable when AI fails

---

## **Closing Thoughts for Panelist**

Remember: You're not just talking about Sirsi—you're modeling a different way of thinking about technology. Every answer should return to:

1. **Who is harmed?** (not just who benefits)
2. **Community ownership** (HBCU Matrix as concrete example)
3. **Personal lived experience** (this isn't theory—it's how you've lived)
4. **Practical action** (what can people do TODAY)

You've built something revolutionary not just technically, but ethically. Let that authenticity shine through. The students in that room—especially at an HBCU—need to see that ethical AI isn't aspirational, it's possible. You're the proof.
