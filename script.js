function emptyTrash() {
    async function getSpaceId() {
        resp = await fetch("https://www.notion.so/api/v3/loadUserContent", { "credentials": "include", "headers": { "accept": "*/*", "cache-control": "no-cache", "content-type": "application/json", "pragma": "no-cache", "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin" }, "referrerPolicy": "same-origin", "body": "{}", "method": "POST", "mode": "cors" });
        json = await resp.json();
        spaceId = Object.keys(json.recordMap.space)[0];
        return spaceId;
    }

    async function getBlockIds(spaceId) {
        body = {
            "type": "BlocksInSpace",
            "query": "",
            "filters": {
                "isDeletedOnly": true,
                "excludeTemplates": false,
                "navigableBlockContentOnly": true,
                "requireEditPermissions": false,
                "includePublicPagesWithoutExplicitAccess": false,
                "ancestors": [],
                "createdBy": [],
                "editedBy": [],
                "lastEditedTime": {},
                "createdTime": {},
                "inTeams": []
            },
            "sort": {
                "field": "lastEdited",
                "direction": "desc"
            },
            "limit": 1000,
            "spaceId": spaceId,
            "source": "trash"
        };
        resp = await fetch("https://www.notion.so/api/v3/search", { "credentials": "include", "headers": { "accept": "*/*", "cache-control": "no-cache", "content-type": "application/json", "pragma": "no-cache", "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin" }, "referrerPolicy": "same-origin", "body": JSON.stringify(body), "method": "POST", "mode": "cors" });
        json = await resp.json();
        blockIds = json.results.map((el) => { return el.id });
        return blockIds;
    }

    (async () => {
        const spaceId = await getSpaceId();
        blockIds = await getBlockIds(spaceId);

        if (blockIds.length == 0) {
            alert("Trash is empty!");
            return;
        }

        const dg = confirm("Are you sure you want to delete " + blockIds.length + " blocks?");
        if (!dg) {
            return;
        }

        body = {
            "blockIds": blockIds,
            "permanentlyDelete": true
        };
        const resp = await fetch("https://www.notion.so/api/v3/deleteBlocks", { "credentials": "include", "headers": { "accept": "*/*", "cache-control": "no-cache", "content-type": "application/json", "pragma": "no-cache", "sec-fetch-mode": "cors", "sec-fetch-site": "same-origin" }, "referrerPolicy": "same-origin", "body": JSON.stringify(body), "method": "POST", "mode": "cors" });

        if (resp.status == 200) {
            alert("Trash emptied!");
        } else {
            alert("Error emptying trash, see console for details.");
            console.log(resp);
        }
    })();
}

function injectEmptyTrashButton(trashMenu) {
    const hideScrollbar = trashMenu.querySelector('.hide-scrollbar');
    const button = document.createElement('button');
    button.innerText = 'Empty Trash';
    button.style = 'flex-shrink: 0;';
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
