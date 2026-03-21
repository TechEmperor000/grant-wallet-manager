import { useEffect } from 'react';

const TAWK_PROPERTY_ID = '69aecea9d82e721c34e2435b';
const TAWK_WIDGET_ID = 'default';

export default function TawkToWidget() {
  useEffect(() => {
    if (TAWK_PROPERTY_ID === 'TAWK_PROPERTY_ID') return; // placeholder — skip loading

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}
