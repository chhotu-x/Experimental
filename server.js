const express = require('express');
const path = require('path');
const fs = require('fs');
let compression;
try {
    compression = require('compression');
} catch (e) {
    console.warn('compression not installed, continuing without it');
    compression = () => (req, res, next) => next();
}

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Compression for better performance
app.use(compression());

// Serve static files with cache control
app.use(
    express.static(path.join(__dirname, 'public'), {
        etag: true,
        lastModified: true,
        maxAge: '7d',
        setHeaders: (res, filePath) => {
            // Long cache for images; moderate for CSS/JS
            if (/(\.png|\.jpg|\.jpeg|\.gif|\.svg|\.webp)$/i.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            } else if (/(\.css|\.js)$/i.test(filePath)) {
                res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
            }
        }
    })
);

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load blog posts
let posts = [];
try {
    const postsPath = path.join(__dirname, 'data', 'posts.json');
    if (fs.existsSync(postsPath)) {
        posts = JSON.parse(fs.readFileSync(postsPath, 'utf-8'));
    }
} catch (e) {
    console.error('Failed to load posts:', e);
}

// Helper: default meta
const withMeta = (overrides = {}) => ({
    meta: {
        description: '42Web.io delivers modern web, mobile, and cloud solutions that help businesses grow.',
        canonical: '',
        ogImage: '/images/og-default.png',
        type: 'website',
        ...overrides
    }
});

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        title: '42Web.io - Tech Solutions',
        currentPage: 'home',
        ...withMeta({
            description: 'Cutting-edge web, mobile, and cloud solutions. Partner with 42Web.io to build, scale, and ship fast.',
            canonical: req.protocol + '://' + req.get('host') + '/',
            ogTitle: '42Web.io - Tech Solutions',
            ogDescription: 'Cutting-edge web, mobile, and cloud solutions.',
        })
    });
});

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About - 42Web.io',
        currentPage: 'about',
        ...withMeta({
            description: 'Learn about 42Web.io—our mission, values, and team building the future of tech.',
            canonical: req.protocol + '://' + req.get('host') + '/about'
        })
    });
});

app.get('/services', (req, res) => {
    res.render('services', {
        title: 'Services - 42Web.io',
        currentPage: 'services',
        ...withMeta({
            description: 'Web development, mobile apps, cloud solutions, UI/UX, security, and DevOps by 42Web.io.',
            canonical: req.protocol + '://' + req.get('host') + '/services'
        })
    });
});

app.get('/contact', (req, res) => {
    res.render('contact', {
        title: 'Contact - 42Web.io',
        currentPage: 'contact',
        ...withMeta({
            description: 'Contact 42Web.io to discuss your project. We respond within 24 hours on business days.',
            canonical: req.protocol + '://' + req.get('host') + '/contact'
        })
    });
});

// Handle contact form submission
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    
    // In a real app, you'd save this to a database or send an email
    console.log('Contact form submission:', { name, email, message });
    
    res.render('contact', {
        title: 'Contact - 42Web.io',
        currentPage: 'contact',
        success: 'Thank you for your message! We\'ll get back to you soon.'
    });
});

// Demo page for embedding functionality
app.get('/demo', (req, res) => {
    res.render('demo', {
        title: 'Embedding Demo - 42Web.io',
        currentPage: 'demo',
        ...withMeta({
            description: 'See how to embed 42Web.io content into other websites using iframes.',
            canonical: req.protocol + '://' + req.get('host') + '/demo'
        })
    });
});

// Embed route for iframe embedding
app.get('/embed', (req, res) => {
    const allowedParams = ['page', 'theme', 'height', 'width'];
    const page = req.query.page || 'home';
    const theme = req.query.theme || 'default';
    
    // Determine which page to embed
    let embedContent = '';
    let pageTitle = '';
    
    switch(page) {
        case 'services':
            embedContent = 'services-embed';
            pageTitle = 'Services - 42Web.io';
            break;
        case 'about':
            embedContent = 'about-embed';
            pageTitle = 'About - 42Web.io';
            break;
        case 'contact':
            embedContent = 'contact-embed';
            pageTitle = 'Contact - 42Web.io';
            break;
        default:
            embedContent = 'home-embed';
            pageTitle = '42Web.io - Tech Solutions';
    }
    
    res.render('embed', {
        title: pageTitle,
        currentPage: page,
        embedContent: embedContent,
        theme: theme,
        ...withMeta({
            description: 'Embeddable 42Web.io content for integration into other websites.',
            canonical: req.protocol + '://' + req.get('host') + '/embed'
        })
    });
});

// Blog routes
app.get('/blog', (req, res) => {
    res.render('blog', {
        title: 'Blog - 42Web.io',
        currentPage: 'blog',
        posts,
        ...withMeta({
            description: 'Insights, tutorials, and updates from the 42Web.io team.',
            canonical: req.protocol + '://' + req.get('host') + '/blog'
        })
    });
});

app.get('/blog/:slug', (req, res) => {
    const post = posts.find(p => p.slug === req.params.slug);
    if (!post) {
        return res.status(404).render('404', { title: '404 - Page Not Found' });
    }
    res.render('blog-post', {
        title: `${post.title} - 42Web.io`,
        currentPage: 'blog',
        post,
        ...withMeta({
            description: post.excerpt || post.title,
            canonical: req.protocol + '://' + req.get('host') + '/blog/' + post.slug,
            ogTitle: post.title,
            ogDescription: post.excerpt || post.title,
            type: 'article'
        })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', {
        title: '404 - Page Not Found',
        currentPage: '',
        ...withMeta({
            description: 'Page not found on 42Web.io'
        })
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', {
        title: 'Error - Something went wrong',
        currentPage: '',
        ...withMeta({
            description: 'An error occurred on 42Web.io'
        })
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
