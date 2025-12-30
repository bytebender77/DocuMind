# 📦 Widget Embed Code Examples

## Basic Embed

```html
<script src="https://your-backend.com/widget/widget.js"
        data-workspace-id="YOUR_WORKSPACE_UUID"
        data-api-url="https://your-backend.com"
        async>
</script>
```

## Local Development

```html
<script src="http://localhost:8000/widget/widget.js"
        data-workspace-id="123e4567-e89b-12d3-a456-426614174000"
        data-api-url="http://localhost:8000"
        async>
</script>
```

## Production Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
</head>
<body>
    <!-- Your website content -->
    <h1>Welcome to My Website</h1>
    <p>Ask our AI assistant anything!</p>
    
    <!-- Chat Widget -->
    <script src="https://api.mycompany.com/widget/widget.js"
            data-workspace-id="550e8400-e29b-41d4-a716-446655440000"
            data-api-url="https://api.mycompany.com"
            async>
    </script>
</body>
</html>
```

## React Component Example

```jsx
import { useEffect } from 'react';

function ChatWidget({ workspaceId, apiUrl = 'https://api.example.com' }) {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = `${apiUrl}/widget/widget.js`;
        script.setAttribute('data-workspace-id', workspaceId);
        script.setAttribute('data-api-url', apiUrl);
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup: remove widget when component unmounts
            const widget = document.getElementById('rag-chat-widget');
            if (widget) {
                widget.remove();
            }
            document.body.removeChild(script);
        };
    }, [workspaceId, apiUrl]);

    return null; // Widget renders itself
}

// Usage
<ChatWidget workspaceId="your-workspace-uuid" />
```

## Vue.js Example

```vue
<template>
    <div>
        <!-- Your component content -->
    </div>
</template>

<script>
export default {
    name: 'MyComponent',
    props: {
        workspaceId: {
            type: String,
            required: true
        },
        apiUrl: {
            type: String,
            default: 'https://api.example.com'
        }
    },
    mounted() {
        const script = document.createElement('script');
        script.src = `${this.apiUrl}/widget/widget.js`;
        script.setAttribute('data-workspace-id', this.workspaceId);
        script.setAttribute('data-api-url', this.apiUrl);
        script.async = true;
        document.body.appendChild(script);
    },
    beforeUnmount() {
        const widget = document.getElementById('rag-chat-widget');
        if (widget) {
            widget.remove();
        }
    }
}
</script>
```

## WordPress Integration

Add to your theme's `footer.php` or use a plugin:

```php
<?php
$workspace_id = 'YOUR_WORKSPACE_UUID'; // Get from settings
$api_url = 'https://api.example.com';
?>
<script src="<?php echo esc_url($api_url); ?>/widget/widget.js"
        data-workspace-id="<?php echo esc_attr($workspace_id); ?>"
        data-api-url="<?php echo esc_url($api_url); ?>"
        async>
</script>
```

## Shopify Integration

Add to your theme's `theme.liquid` (before `</body>`):

```liquid
<script src="https://api.example.com/widget/widget.js"
        data-workspace-id="{{ settings.chat_workspace_id }}"
        data-api-url="https://api.example.com"
        async>
</script>
```

## Next.js Example

```jsx
// pages/_app.js or components/ChatWidget.jsx
import { useEffect } from 'react';

export default function ChatWidget() {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = process.env.NEXT_PUBLIC_API_URL + '/widget/widget.js';
        script.setAttribute('data-workspace-id', process.env.NEXT_PUBLIC_WORKSPACE_ID);
        script.setAttribute('data-api-url', process.env.NEXT_PUBLIC_API_URL);
        script.async = true;
        document.body.appendChild(script);

        return () => {
            const widget = document.getElementById('rag-chat-widget');
            if (widget) widget.remove();
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    return null;
}
```

## Multiple Widgets (Not Recommended)

The widget is designed to be loaded once per page. Loading multiple instances may cause conflicts.

## Custom Styling Override

```html
<style>
    /* Override widget colors */
    #rag-chat-widget .rag-chat-bubble {
        background: linear-gradient(135deg, #ff6b6b, #ee5a6f) !important;
    }
    
    #rag-chat-widget .rag-chat-header {
        background: linear-gradient(135deg, #ff6b6b, #ee5a6f) !important;
    }
</style>

<script src="https://api.example.com/widget/widget.js"
        data-workspace-id="YOUR_WORKSPACE_UUID"
        data-api-url="https://api.example.com"
        async>
</script>
```


