import { useEffect } from 'react';

interface VismeFormProps {
    formId: string;
    url: string;
    title: string;
}

export default function VismeForm({ formId, url, title }: VismeFormProps) {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://static-bundles.visme.co/forms/vismeforms-embed.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Small cleanup - though Visme scripts usually stick to the global window
            const existingScript = document.querySelector(`script[src="${script.src}"]`);
            if (existingScript) {
                document.body.removeChild(existingScript);
            }
        };
    }, []);

    return (
        <div
            className="visme_d"
            data-title={title}
            data-url={url}
            data-domain="forms"
            data-full-page="false"
            data-min-height="600px"
            data-form-id={formId}
            style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}
        />
    );
}
