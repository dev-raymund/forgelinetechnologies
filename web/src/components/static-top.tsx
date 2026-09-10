/* Homepage sections: nav, hero, services, packages, process, counters.
   Maintained directly in this file. */
export default function StaticTop() {
  return (
    <>

    <div className="bg-glows" aria-hidden="true">
      <span className="glow glow-1"></span>
      <span className="glow glow-2"></span>
    </div>

    
    <header className="nav">
      <div className="nav-inner">
        <a className="brand" href="#top">
          <svg className="fg-logo" viewBox="0 0 190 44" role="img" aria-label="Forgeline Technologies">
          <defs>
            <linearGradient id="fgGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#016ecc" /><stop offset="1" stopColor="#19d2fe" />
            </linearGradient>
            <clipPath id="fgClip"><circle cx="20" cy="22" r="19" /></clipPath>
          </defs>
          <circle className="fg-tile" cx="20" cy="22" r="19" />
          <g clipPath="url(#fgClip)">
            <path className="fg-wave" d="M0.0,30.6C0.6,30.7 2.2,31.1 3.3,31.2C4.4,31.4 5.6,31.4 6.7,31.4C7.8,31.4 8.9,31.2 10.0,31.1C11.1,30.9 12.2,30.6 13.3,30.3C14.4,30.0 15.6,29.7 16.7,29.4C17.8,29.0 18.9,28.7 20.0,28.4C21.1,28.2 22.2,27.9 23.3,27.8C24.4,27.6 25.6,27.6 26.7,27.6C27.8,27.6 28.9,27.8 30.0,27.9C31.1,28.1 32.2,28.4 33.3,28.7C34.4,29.0 35.6,29.3 36.7,29.6C37.8,30.0 39.4,30.4 40.0,30.6L40,42L0,42Z" />
          </g>
          <path className="fg-mark" d="M12.5 12.5 H28.5 V17.5 H18 V31.5 H12.5 Z" />
          <rect className="fg-bar" x="18" y="20.2" width="8.4" height="4.6" rx="0.6" />
          <text className="fg-word" x="48" y="25" fontSize="20.5" fontWeight="900" letterSpacing="-0.5">Forgeline</text>
          <text className="fg-sub" x="49" y="37" fontSize="7.6" fontWeight="700" letterSpacing="3.1">TECHNOLOGIES</text>
        </svg>
        </a>
        <nav>
          <a href="#products">Products</a>
          <a href="#process">Process</a>
          <a href="#work">Work</a>
          <a href="/blog">Blog</a>
          
          <a href="#about">About</a>
          <a href="#faq">FAQ</a>
          <a href="#contact" className="btn btn-small">Start a project</a>
        </nav>
      </div>
    </header>

    
    <section className="hero" id="top">
      <div className="hero-inner">
      <div className="hero-text">
        <span className="badge"><span className="ping"></span> Available for new projects</span>
        <p className="kicker">Full-stack web development</p>
        <h1>We build the site that<br />wins you the work</h1>
        <p className="lede">
          Web design, websites, web apps, and e-commerce — front-end to back-end, built
          clean and launched on time. We help businesses and founders turn ideas into products.
        </p>
        <div className="hero-cta">
          <a href="#contact" className="btn btn-lg">Start a project</a>
          <a href="#work" className="btn btn-ghost btn-lg">See our work</a>
        </div>
      </div>
      <div className="hero-visual">
        <svg className="illus hero-illus" viewBox="87 63 426 331" fill="none" role="img" aria-hidden="true"><g className="pc" style={{ '--i': '0' } as React.CSSProperties}><polygon points="300.0,150.0 502.6,267.0 300.0,384.0 97.4,267.0" fill="#d6ecfb" /></g><g className="pc" style={{ '--i': '1' } as React.CSSProperties}><polygon points="187.4,113.6 331.5,196.8 321.4,202.6 177.3,119.4" fill="#0159a6" /><polygon points="177.3,228.7 177.3,119.4 321.4,202.6 321.4,311.9" fill="#016ecc" /><polygon points="187.4,222.8 187.4,113.6 177.3,119.4 177.3,228.7" fill="#0159a6" /><polygon points="187.4,152.6 257.2,192.9 257.2,182.0 187.4,141.7" fill="#ffffff" /><polygon points="187.4,169.5 232.5,195.5 232.5,187.7 187.4,161.7" fill="#19d2fe" /><polygon points="188.5,223.4 198.0,228.9 198.0,205.5 188.5,200.0" fill="#9ddffb" /><polygon points="204.8,232.8 214.2,238.3 214.2,199.3 204.8,193.8" fill="#19d2fe" /><polygon points="221.0,242.2 230.4,247.6 230.4,217.7 221.0,212.3" fill="#ffffff" /><polygon points="237.2,251.5 246.6,257.0 246.6,207.6 237.2,202.1" fill="#9ddffb" /><polygon points="276.4,272.9 307.9,291.1 307.9,254.7 276.4,236.4" fill="#19d2fe" /></g><g className="pc" style={{ '--i': '2' } as React.CSSProperties}><polygon points="246.0,257.9 266.2,269.6 259.5,273.5 239.2,261.8" fill="#1b2d45" /><polygon points="239.2,282.6 239.2,261.8 259.5,273.5 259.5,294.3" fill="#2b3d55" /><polygon points="246.0,278.7 246.0,257.9 239.2,261.8 239.2,282.6" fill="#1b2d45" /></g><g className="pc" style={{ '--i': '3' } as React.CSSProperties}><polygon points="234.7,266.7 288.7,297.9 276.4,305.1 222.3,273.9" fill="#2b3d55" /><polygon points="222.3,278.0 222.3,273.9 276.4,305.1 276.4,309.2" fill="#1b2d45" /><polygon points="234.7,270.9 234.7,266.7 222.3,273.9 222.3,278.0" fill="#1b2d45" /></g><g className="pc" style={{ '--i': '4' } as React.CSSProperties}><polygon points="268.5,216.6 336.0,255.6 311.3,269.9 243.7,230.9" fill="#ffffff" /><polygon points="243.7,234.5 243.7,230.9 311.3,269.9 311.3,273.5" fill="#d4e8fa" /><polygon points="268.5,220.2 268.5,216.6 243.7,230.9 243.7,234.5" fill="#b9d8f2" /></g><g className="pc" style={{ '--i': '5' } as React.CSSProperties}><polygon points="354.0,268.6 370.9,278.3 359.7,284.8 342.8,275.1" fill="#ffffff" /><polygon points="342.8,278.7 342.8,275.1 359.7,284.8 359.7,288.4" fill="#d4e8fa" /><polygon points="354.0,272.2 354.0,268.6 342.8,275.1 342.8,278.7" fill="#b9d8f2" /></g><g className="pc float" style={{ '--i': '6' } as React.CSSProperties}><polygon points="435.1,171.8 477.9,196.5 448.6,213.4 405.8,188.7" fill="#eaf4fd" /><polygon points="405.8,192.9 405.8,188.7 448.6,213.4 448.6,217.6" fill="#d4e8fa" /><polygon points="435.1,176.0 435.1,171.8 405.8,188.7 405.8,192.9" fill="#b9d8f2" /></g><g className="pc float" style={{ '--i': '7' } as React.CSSProperties}><polygon points="282.0,73.0 315.8,92.5 291.0,106.8 257.2,87.3" fill="#19d2fe" /><polygon points="257.2,91.5 257.2,87.3 291.0,106.8 291.0,111.0" fill="#19d2fe" /><polygon points="282.0,77.2 282.0,73.0 257.2,87.3 257.2,91.5" fill="#12a8cc" /></g><g className="pc float" style={{ '--i': '8' } as React.CSSProperties}><polygon points="363.0,262.8 390.1,278.4 369.8,290.1 342.8,274.5" fill="#9ddffb" /><polygon points="342.8,278.7 342.8,274.5 369.8,290.1 369.8,294.3" fill="#9ddffb" /><polygon points="363.0,267.0 363.0,262.8 342.8,274.5 342.8,278.7" fill="#79c6ea" /></g></svg>
      </div>
      </div>
    </section>

    
    <section className="stack-section wv-white">
      <div className="stack-inner">
        <p className="stack-label">Built with the tools your project needs</p>
        <div className="marquee">
          <div className="marquee-track">
          <span><img src="assets/tech/react.svg" alt="" />React</span>
          <span><img src="assets/tech/nodedotjs.svg" alt="" />Node.js</span>
          <span><img src="assets/tech/javascript.svg" alt="" />JavaScript</span>
          <span><img src="assets/tech/laravel.svg" alt="" />Laravel</span>
          <span><img src="assets/tech/php.svg" alt="" />PHP</span>
          <span><img src="assets/tech/vuedotjs.svg" alt="" />Vue</span>
          <span><img src="assets/tech/mysql.svg" alt="" />MySQL</span>
          <span><img src="assets/tech/mongodb.svg" alt="" />MongoDB</span>
          <span><img src="assets/tech/docker.svg" alt="" />Docker</span>
          <span><img src="assets/tech/tailwindcss.svg" alt="" />Tailwind</span>
          <span><img src="assets/tech/wordpress.svg" alt="" />WordPress</span>
          <span><img src="assets/tech/shopify.svg" alt="" />Shopify</span>
          <span><img src="assets/tech/woocommerce.svg" alt="" />WooCommerce</span>
          <span><img src="assets/tech/jquery.svg" alt="" />jQuery</span>
          <span><img src="assets/tech/figma.svg" alt="" />Figma</span>
          <span><img src="assets/tech/git.svg" alt="" />Git</span>
          
          <span><img src="assets/tech/react.svg" alt="" />React</span>
          <span><img src="assets/tech/nodedotjs.svg" alt="" />Node.js</span>
          <span><img src="assets/tech/javascript.svg" alt="" />JavaScript</span>
          <span><img src="assets/tech/laravel.svg" alt="" />Laravel</span>
          <span><img src="assets/tech/php.svg" alt="" />PHP</span>
          <span><img src="assets/tech/vuedotjs.svg" alt="" />Vue</span>
          <span><img src="assets/tech/mysql.svg" alt="" />MySQL</span>
          <span><img src="assets/tech/mongodb.svg" alt="" />MongoDB</span>
          <span><img src="assets/tech/docker.svg" alt="" />Docker</span>
          <span><img src="assets/tech/tailwindcss.svg" alt="" />Tailwind</span>
          <span><img src="assets/tech/wordpress.svg" alt="" />WordPress</span>
          <span><img src="assets/tech/shopify.svg" alt="" />Shopify</span>
          <span><img src="assets/tech/woocommerce.svg" alt="" />WooCommerce</span>
          <span><img src="assets/tech/jquery.svg" alt="" />jQuery</span>
          <span><img src="assets/tech/figma.svg" alt="" />Figma</span>
          <span><img src="assets/tech/git.svg" alt="" />Git</span>
        </div>
        </div>
      </div>
    </section>


    
    <section className="wrap band wv-blue">
      <div className="sec-head">
        <p className="kicker">Capabilities</p>
        <h2>What we <span className="grad-text">build</span></h2>
        <p className="sub">
          Front-end to back-end, on whatever stack the job actually calls for — not
          whatever we happen to sell.
        </p>
        <a className="sec-cta" href="#products">View our fixed-price packages
          <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
      </div>
      <div className="cap-grid">
        <div className="cap">
          <svg className="illus cap-illus" viewBox="18 8 263 206" fill="none" role="img" aria-hidden="true"><g className="pc" style={{ '--i': '0' } as React.CSSProperties}><polygon points="150.0,64.0 271.6,134.2 150.0,204.4 28.4,134.2" fill="#d6ecfb" /></g><g className="pc" style={{ '--i': '1' } as React.CSSProperties}><polygon points="82.5,38.0 177.0,92.6 168.0,97.8 73.4,43.2" fill="#0159a6" /><polygon points="73.4,110.8 73.4,43.2 168.0,97.8 168.0,165.4" fill="#016ecc" /><polygon points="82.5,105.6 82.5,38.0 73.4,43.2 73.4,110.8" fill="#0159a6" /><polygon points="82.9,65.6 119.2,86.5 119.2,81.3 82.9,60.4" fill="#ffffff" /><polygon points="82.9,76.5 108.0,91.0 108.0,85.8 82.9,71.3" fill="#19d2fe" /><polygon points="82.9,87.4 124.8,111.6 124.8,106.4 82.9,82.2" fill="#ffffff" /><polygon points="82.9,98.3 102.4,109.6 102.4,104.4 82.9,93.1" fill="#19d2fe" /></g><g className="pc" style={{ '--i': '2' } as React.CSSProperties}><polygon points="118.5,127.7 134.2,136.8 128.6,140.0 112.8,130.9" fill="#1b2d45" /><polygon points="112.8,142.7 112.8,130.9 128.6,140.0 128.6,151.8" fill="#2b3d55" /><polygon points="118.5,139.4 118.5,127.7 112.8,130.9 112.8,142.7" fill="#1b2d45" /></g><g className="pc float" style={{ '--i': '3' } as React.CSSProperties}><polygon points="143.2,106.1 188.3,132.1 170.3,142.5 125.2,116.5" fill="#eaf4fd" /><polygon points="125.2,119.9 125.2,116.5 170.3,142.5 170.3,145.9" fill="#d4e8fa" /><polygon points="143.2,109.5 143.2,106.1 125.2,116.5 125.2,119.9" fill="#b9d8f2" /></g></svg>
          <strong>Websites &amp; Web Apps</strong>
          <span>Marketing sites and full-stack products alike — React or Vue on the front,
          Node or Laravel behind it. Designed to convert, built to last.</span>
        </div>
        <div className="cap">
          <svg className="illus cap-illus" viewBox="18 8 263 206" fill="none" role="img" aria-hidden="true"><g className="pc" style={{ '--i': '0' } as React.CSSProperties}><polygon points="150.0,64.0 271.6,134.2 150.0,204.4 28.4,134.2" fill="#d6ecfb" /></g><g className="pc" style={{ '--i': '1' } as React.CSSProperties}><polygon points="100.5,71.8 134.2,91.3 100.5,110.8 66.7,91.3" fill="#19d2fe" /><polygon points="66.7,130.3 66.7,91.3 100.5,110.8 100.5,149.8" fill="#19d2fe" /><polygon points="100.5,110.8 100.5,71.8 66.7,91.3 66.7,130.3" fill="#12a8cc" /></g><g className="pc" style={{ '--i': '2' } as React.CSSProperties}><polygon points="138.7,109.5 168.0,126.4 138.7,143.3 109.5,126.4" fill="#9ddffb" /><polygon points="109.5,155.0 109.5,126.4 138.7,143.3 138.7,171.9" fill="#9ddffb" /><polygon points="138.7,138.1 138.7,109.5 109.5,126.4 109.5,155.0" fill="#79c6ea" /></g><g className="pc" style={{ '--i': '3' } as React.CSSProperties}><polygon points="152.3,44.5 183.8,62.7 152.3,80.9 120.7,62.7" fill="#016ecc" /><polygon points="120.7,114.7 120.7,62.7 152.3,80.9 152.3,132.9" fill="#19d2fe" /><polygon points="152.3,96.5 152.3,44.5 120.7,62.7 120.7,114.7" fill="#0159a6" /></g><g className="pc float" style={{ '--i': '4' } as React.CSSProperties}><polygon points="190.5,100.4 213.0,113.4 190.5,126.4 168.0,113.4" fill="#eaf4fd" /><polygon points="168.0,136.8 168.0,113.4 190.5,126.4 190.5,149.8" fill="#d4e8fa" /><polygon points="190.5,123.8 190.5,100.4 168.0,113.4 168.0,136.8" fill="#b9d8f2" /></g></svg>
          <strong>E-commerce Stores</strong>
          <span>Shopify, WooCommerce, or a fully custom checkout. Product templates,
          payments and shipping wired up and tested before you launch.</span>
        </div>
        <div className="cap">
          <svg className="illus cap-illus" viewBox="18 8 263 206" fill="none" role="img" aria-hidden="true"><g className="pc" style={{ '--i': '0' } as React.CSSProperties}><polygon points="150.0,64.0 271.6,134.2 150.0,204.4 28.4,134.2" fill="#d6ecfb" /></g><g className="pc" style={{ '--i': '1' } as React.CSSProperties}><polygon points="107.2,75.7 127.5,87.4 107.2,99.1 87.0,87.4" fill="#9ddffb" /><polygon points="87.0,113.4 87.0,87.4 107.2,99.1 107.2,125.1" fill="#9ddffb" /><polygon points="107.2,101.7 107.2,75.7 87.0,87.4 87.0,113.4" fill="#79c6ea" /></g><g className="pc" style={{ '--i': '2' } as React.CSSProperties}><polygon points="133.1,67.2 153.4,78.9 133.1,90.6 112.8,78.9" fill="#19d2fe" /><polygon points="112.8,128.3 112.8,78.9 133.1,90.6 133.1,140.0" fill="#19d2fe" /><polygon points="133.1,116.6 133.1,67.2 112.8,78.9 112.8,128.3" fill="#12a8cc" /></g><g className="pc" style={{ '--i': '3' } as React.CSSProperties}><polygon points="159.0,56.2 179.3,67.9 159.0,79.6 138.7,67.9" fill="#016ecc" /><polygon points="138.7,143.3 138.7,67.9 159.0,79.6 159.0,155.0" fill="#016ecc" /><polygon points="159.0,131.6 159.0,56.2 138.7,67.9 138.7,143.3" fill="#0159a6" /></g><g className="pc" style={{ '--i': '4' } as React.CSSProperties}><polygon points="184.9,45.1 205.2,56.9 184.9,68.5 164.6,56.9" fill="#04407a" /><polygon points="164.6,158.2 164.6,56.9 184.9,68.5 184.9,169.9" fill="#04407a" /><polygon points="184.9,146.5 184.9,45.1 164.6,56.9 164.6,158.2" fill="#032f59" /></g><g className="pc float" style={{ '--i': '5' } as React.CSSProperties}><polygon points="222.1,18.5 249.1,34.1 228.8,45.8 201.8,30.2" fill="#eaf4fd" /><polygon points="201.8,34.1 201.8,30.2 228.8,45.8 228.8,49.7" fill="#d4e8fa" /><polygon points="222.1,22.4 222.1,18.5 201.8,30.2 201.8,34.1" fill="#b9d8f2" /></g></svg>
          <strong>APIs &amp; Integrations</strong>
          <span>REST APIs, databases and server logic — plus the integrations and
          automations that connect your site to the tools you already run on.</span>
        </div>
      </div>
    </section>

    
    <section className="wrap wv-white wv-alt" id="products">
      <div className="sec-head">
        <p className="kicker">Our products</p>
        <h2>Packaged offers, <span className="grad-text">fixed scope</span></h2>
        <p className="sub">
          Every engagement starts with a free scoping call and a fixed quote — no surprises.
        </p>
      </div>
      <div className="products">
        <div className="card pcard pcard-dark">
          <div className="pcard-head">
            <svg className="pcard-ic" viewBox="0 0 24 24"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" /></svg>
            <strong>Web App Build</strong>
            <span className="pcard-aud">For founders</span>
          </div>
          <div className="pcard-pricerow">
            <p className="price">from $4,000<span>/ project</span></p>
            <a href="#contact" className="btn">Get started</a>
          </div>
          <div className="pcard-body">
            <div className="pcard-incl">
              <h4>What's included</h4>
              <p>Your idea built into a real, production-ready product — front-end to back-end, in 4–8 weeks.</p>
            </div>
            <ul className="checklist">
              <li>Discovery + scoping</li>
              <li>Front-end + back-end</li>
              <li>Auth, database, APIs</li>
              <li>Deployed + full handover</li>
            </ul>
          </div>
        </div>

        <div className="card pcard surface">
          <div className="pcard-head">
            <svg className="pcard-ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /></svg>
            <strong>Site Sprint</strong>
            <span className="pcard-aud">For small businesses</span>
          </div>
          <div className="pcard-pricerow">
            <p className="price">from $800<span>/ project</span></p>
            <a href="#contact" className="btn">Get started</a>
          </div>
          <div className="pcard-body">
            <div className="pcard-incl">
              <h4>What's included</h4>
              <p>A clean, fast website designed and shipped in one to two weeks.</p>
            </div>
            <ul className="checklist">
              <li>Custom-coded or CMS-built</li>
              <li>Up to ~5 pages, responsive</li>
              <li>Lead form + basic SEO</li>
              <li>Deployed live</li>
            </ul>
          </div>
        </div>

        <div className="card pcard surface">
          <div className="pcard-head">
            <svg className="pcard-ic" viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></svg>
            <strong>Build Partner</strong>
            <span className="pcard-aud">For ongoing work</span>
          </div>
          <div className="pcard-pricerow">
            <p className="price">from $1,500<span>/ month</span></p>
            <a href="#contact" className="btn">Get started</a>
          </div>
          <div className="pcard-body">
            <div className="pcard-incl">
              <h4>What's included</h4>
              <p>A dedicated developer on tap, month to month — cancel anytime.</p>
            </div>
            <ul className="checklist">
              <li>Ongoing features &amp; fixes</li>
              <li>Front-end &amp; back-end work</li>
              <li>Priority support</li>
              <li>Dedicated capacity</li>
            </ul>
          </div>
        </div>

        <div className="card pcard surface">
          <div className="pcard-head">
            <svg className="pcard-ic" viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.5-3 7.6-7 9c-4-1.4-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></svg>
            <strong>Care Plan</strong>
            <span className="pcard-aud">For peace of mind</span>
          </div>
          <div className="pcard-pricerow">
            <p className="price">from $150<span>/ month</span></p>
            <a href="#contact" className="btn">Get started</a>
          </div>
          <div className="pcard-body">
            <div className="pcard-incl">
              <h4>What's included</h4>
              <p>Hosting, updates, and maintenance handled so your site stays healthy.</p>
            </div>
            <ul className="checklist">
              <li>Hosting, backups, monitoring</li>
              <li>Updates &amp; security</li>
              <li>Small fixes &amp; tweaks</li>
              <li>Monthly report</li>
            </ul>
          </div>
        </div>
      </div>

      
      <h3 className="addons-title">Also available</h3>
      <p className="addons-sub">Smaller pieces of work, priced the same way — fixed, up front.</p>
      <div className="addons">
        <div className="addon" style={{ '--ac': '#016ecc', '--ac-soft': 'rgba(1,110,204,.12)' } as React.CSSProperties}>
          <span className="addon-ic"><svg viewBox="0 0 24 24"><path d="M2 3h2l2.4 12h11l2-8H6" /><circle cx="9" cy="20" r="1.1" /><circle cx="18" cy="20" r="1.1" /></svg></span>
          <h4>Online Store</h4>
          <p>E-commerce build — Shopify, WooCommerce, or a fully custom checkout.</p>
          <div className="addon-foot">
            <p className="price">from $2,500</p>
            <a className="addon-cta" href="#contact">Get a quote
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
          </div>
        </div>
        <div className="addon" style={{ '--ac': '#0a8fd8', '--ac-soft': 'rgba(25,210,254,.18)' } as React.CSSProperties}>
          <span className="addon-ic"><svg viewBox="0 0 24 24"><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></svg></span>
          <h4>Speed &amp; SEO Tune-up</h4>
          <p>Make a slow site fast — performance, SEO, Core Web Vitals.</p>
          <div className="addon-foot">
            <p className="price">from $400</p>
            <a className="addon-cta" href="#contact">Get a quote
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
          </div>
        </div>
        <div className="addon" style={{ '--ac': '#04407a', '--ac-soft': 'rgba(4,64,122,.10)' } as React.CSSProperties}>
          <span className="addon-ic"><svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></svg></span>
          <h4>Migration &amp; Redesign</h4>
          <p>Move platforms or refresh an old site — without losing data or rankings.</p>
          <div className="addon-foot">
            <p className="price">from $600</p>
            <a className="addon-cta" href="#contact">Get a quote
              <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
          </div>
        </div>
      </div>
    </section>

    
    <section className="wrap band wv-blue" id="process">
      <div className="sec-head">
        <p className="kicker">Process</p>
        <h2>How we <span className="grad-text">work</span></h2>
        <p className="sub">
          Four steps, no mystery. You know the price and the plan before any code is written.
        </p>
      </div>
      <ol className="steps">
        <li className="surface">
          <span className="num">1</span>
          <h3>Scope</h3>
          <p>A free call to understand the goal. You get a fixed plan and price.</p>
        </li>
        <li className="surface">
          <span className="num">2</span>
          <h3>Plan</h3>
          <p>We map the build, design the key pages, and agree the milestones.</p>
        </li>
        <li className="surface">
          <span className="num">3</span>
          <h3>Build</h3>
          <p>Focused work with regular check-ins. You always see real progress.</p>
        </li>
        <li className="surface">
          <span className="num">4</span>
          <h3>Launch &amp; support</h3>
          <p>Deployed, tested, handed over clean — with optional ongoing care.</p>
        </li>
      </ol>
    </section>

    
    <section className="wrap wv-white wv-alt">
      <div className="split">
        <div className="split-text">
          <p className="kicker">Our promise</p>
          <h2>Your launch date is the whole point</h2>
          <p>
            Most web projects fail on delivery, not on design. Every Forgeline engagement
            starts with a fixed scope and a fixed price, so the number you approve is the
            number you pay — and the date we agree is the date it goes live.
          </p>
          <ul className="tickpair">
            <li>Fixed scope, fixed price</li>
            <li>Straight to a senior developer</li>
            <li>Weekly progress you can see</li>
            <li>Never a junior or account manager</li>
            <li>Clean handover, no lock-in</li>
            <li>Production-grade, built to maintain</li>
          </ul>
          <a href="#contact" className="btn">Book a scoping call</a>
        </div>
        <div className="split-visual">
          <svg className="illus split-illus" viewBox="56 55 308 201" fill="none" role="img" aria-hidden="true"><g className="pc" style={{ '--i': '0' } as React.CSSProperties}><polygon points="210.0,80.0 354.1,163.2 210.0,246.4 65.9,163.2" fill="#d6ecfb" /></g><g className="pc" style={{ '--i': '1' } as React.CSSProperties}><polygon points="210.0,102.1 286.6,146.3 210.0,190.5 133.4,146.3" fill="#04407a" /><polygon points="133.4,160.6 133.4,146.3 210.0,190.5 210.0,204.8" fill="#04407a" /><polygon points="210.0,116.4 210.0,102.1 133.4,146.3 133.4,160.6" fill="#032f59" /></g><g className="pc" style={{ '--i': '2' } as React.CSSProperties}><polygon points="210.0,86.5 275.3,124.2 210.0,161.9 144.7,124.2" fill="#016ecc" /><polygon points="144.7,138.5 144.7,124.2 210.0,161.9 210.0,176.2" fill="#016ecc" /><polygon points="210.0,100.8 210.0,86.5 144.7,124.2 144.7,138.5" fill="#0159a6" /></g><g className="pc" style={{ '--i': '3' } as React.CSSProperties}><polygon points="210.0,70.9 264.0,102.1 210.0,133.3 156.0,102.1" fill="#19d2fe" /><polygon points="156.0,116.4 156.0,102.1 210.0,133.3 210.0,147.6" fill="#19d2fe" /><polygon points="210.0,85.2 210.0,70.9 156.0,102.1 156.0,116.4" fill="#12a8cc" /></g><g className="pc float" style={{ '--i': '4' } as React.CSSProperties}><polygon points="210.0,65.4 234.8,79.7 210.0,94.0 185.2,79.7" fill="#9ddffb" /><polygon points="185.2,83.9 185.2,79.7 210.0,94.0 210.0,98.2" fill="#9ddffb" /><polygon points="210.0,69.6 210.0,65.4 185.2,79.7 185.2,83.9" fill="#79c6ea" /></g><g className="pc float" style={{ '--i': '5' } as React.CSSProperties}><polygon points="311.3,106.0 331.6,117.7 315.8,126.8 295.6,115.1" fill="#eaf4fd" /><polygon points="295.6,119.0 295.6,115.1 315.8,126.8 315.8,130.7" fill="#d4e8fa" /><polygon points="311.3,109.9 311.3,106.0 295.6,115.1 295.6,119.0" fill="#b9d8f2" /></g></svg>
        </div>
      </div>
    </section>

    
    <section className="counters-band wv-grad">
      <div className="counters">
        <div className="counter"><strong data-to="6" data-suffix="+">0</strong><span>Years building</span></div>
        <div className="counter"><strong data-to="17">0</strong><span>Projects shipped</span></div>
        <div className="counter"><strong data-to="4">0</strong><span>Countries served</span></div>
        <div className="counter"><strong data-to="100" data-suffix="%">0</strong><span>Code ownership</span></div>
      </div>
    </section>

    
    
    </>
  );
}
