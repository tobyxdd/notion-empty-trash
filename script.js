function emptyTrash() {
    async function getSpaceId() {
        resp = await fetch("https://www.notion.so/api/v3/loadUserContent", { "credentials": "include", "headers": { "accept": "*/*", "cache-control": "no-cache", "content-type": "application/json", "pragma": "no-cache", "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin" }, "referrerPolicy": "same-origin", "body": "{}", "method": "POST", "mode": "cors" });
        json = await resp.json();
        spaceId = Object.keys(json.recordMap.space)[0];
        return spaceId;
    }

    async function getBlockIds(spaceId) {
        resp = await fetch("https://www.notion.so/api/v3/search", { "credentials": "include", "headers": { "accept": "*/*", "cache-control": "no-cache", "content-type": "application/json", "pragma": "no-cache", "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin" }, "referrerPolicy": "same-origin", "body": "{\"type\":\"BlocksInSpace\",\"query\":\"\",\"filters\":{\"isDeletedOnly\":true,\"excludeTemplates\":false,\"isNavigableOnly\":true,\"requireEditPermissions\":false,\"ancestors\":[],\"createdBy\":[],\"editedBy\":[],\"lastEditedTime\":{},\"createdTime\":{}},\"sort\":\"Relevance\",\"limit\":1000,\"spaceId\":\"" + spaceId + "\",\"source\":\"trash\"}", "method": "POST", "mode": "cors" });
        json = await resp.json();
        blockIds = json.results.map((el) => { return el.id });
        return blockIds;
    }

    (async () => {
        const spaceId = await getSpaceId();
        blockIds = await getBlockIds(spaceId);
        count = 0;
        for (const blockId of blockIds) {
            const blockIdEscaped = '\"' + blockId + '\"';
            await fetch("https://www.notion.so/api/v3/deleteBlocks", { "credentials": "include", "headers": { "accept": "*/*", "cache-control": "no-cache", "content-type": "application/json", "pragma": "no-cache", "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin" }, "referrerPolicy": "same-origin", "body": "{\"blockIds\":[" + blockIdEscaped + "],\"permanentlyDelete\":true}", "method": "POST", "mode": "cors" });
            count++;
        }
        alert(count + " blocks deleted");
    })();
}

function injectEmptyTrashButton(trashMenu) {
    const hideScrollbar = trashMenu.querySelector('.hide-scrollbar');
    const button = document.createElement('button');
    button.innerText = 'Empty Trash';
    button.onclick = emptyTrash;
    hideScrollbar.appendChild(button);
}

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const trashMenu = node.querySelector('.notion-sidebar-trash-menu');
                    if (trashMenu) {
                        injectEmptyTrashButton(trashMenu);
                    }
                }
            });
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
