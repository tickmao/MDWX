var focusMediumTheme = {
    BASE: {
        'text-align': 'justify',
        'color': '#242424', // Medium Black
        'line-height': '1.8', // Book-like spacing
        'letter-spacing': '0.01em',
        'font-size': '14px' // Restrained Base
    },
    BASE_BLOCK: {
        'margin': '24px 16px'
    },
    block: {
        h1: {
            'font-size': '22px', // Restrained
            'font-weight': '700',
            'margin': '56px 0 24px 0',
            'line-height': '1.3',
            'color': '#111',
            'letter-spacing': '-0.02em',
            'text-align': 'left'
        },
        h2: {
            'font-size': '18px',
            'font-weight': '700',
            'margin': '48px 0 20px 0', // Pure whitespace separation
            'line-height': '1.35',
            'color': '#111',
            'text-align': 'left',
            'padding-bottom': '0',
            'border-bottom': 'none' // NO BORDER
        },
        h3: {
            'font-weight': '700',
            'font-size': '16px',
            'margin': '32px 0 16px 0',
            'line-height': '1.4',
            'color': '#111', // Deep Black like H1/H2
            'text-align': 'left'
        },
        h4: {
            'font-weight': '700',
            'font-size': '15px',
            'margin': '24px 0 12px 0',
            'color': '#292929',
            'text-align': 'left'
        },
        p: {
            'margin': '1.8em 0',
            'text-align': 'justify'
        },
        blockquote: {
            'color': '#666',
            'padding-left': '20px',
            'border-left': '3px solid #111', // The classic Medium thick line
            'margin': '32px 0',
            'font-style': 'italic',
            'line-height': '1.7',
            'background': 'transparent' // No background
        },
        code: {
            'font-size': '13px',
            'color': '#242424',
            'background': '#f9f9f9',
            'border-radius': '4px',
            'padding': '4px 6px',
            'margin': '0 2px',
            'font-family': "Menlo, Monaco, 'Courier New', monospace",
            'border': '1px solid rgba(0,0,0,0.05)'
        },
        image: {
            'display': 'block',
            'margin': '32px auto',
            'width': '100%',
            'border-radius': '0', // Medium images are often sharp or full width
            'box-shadow': 'none'
        },
        ol: {
            'margin': '20px 0',
            'padding-left': '20px'
        },
        ul: {
            'margin': '20px 0',
            'padding-left': '20px',
            'list-style': 'disc'
        }
    },
    inline: {
        listitem: {
            'display': 'list-item',
            'margin': '10px 0',
            'line-height': '1.75',
            'text-align': 'justify'
        },
        codespan: {
            'font-size': '0.9em',
            'color': '#242424',
            'background': 'rgba(0,0,0,0.05)',
            'padding': '3px 6px',
            'margin': '0 2px',
            'border-radius': '3px'
        },
        link: {
            'color': '#111',
            'text-decoration': 'underline',
            'text-underline-offset': '4px',
            'text-decoration-thickness': '1px',
            'font-weight': '400'
        },
        strong: {
            'font-weight': '700',
            'color': '#111'
        },
        em: {
            'font-style': 'italic',
            'color': '#333'
        },
        table: {
            'border-collapse': 'collapse',
            'margin': '32px auto',
            'width': '100%',
            'font-size': '12px',
            'border': 'none',
            'border-top': '1px solid #111',
            'border-bottom': '1px solid #111'
        },
        thead: {
            'background': '#fff',
            'border-bottom': '1px solid #eee'
        },
        th: {
            'padding': '10px 6px',
            'font-weight': '700',
            'color': '#111',
            'text-align': 'center'
        },
        td: {
            'border-bottom': '1px solid #eee',
            'padding': '10px 6px',
            'color': '#333',
            'line-height': '1.5'
        }
    }
};
