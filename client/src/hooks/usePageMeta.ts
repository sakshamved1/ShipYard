import * as React from "react";

export function usePageMeta(title: string, description?: string) {
  React.useEffect(() => {
    const prevTitle = document.title;
    document.title = title.includes("ShipYard") ? title : `${title} | ShipYard`;

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute("content") : null;

    if (description) {
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }

    return () => {
      document.title = prevTitle;
      if (prevDesc && metaDesc) {
        metaDesc.setAttribute("content", prevDesc);
      }
    };
  }, [title, description]);
}
