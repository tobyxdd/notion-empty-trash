function emptyTrash() {
  function standardizeUUID(uuid) {
    if (uuid?.length === 32 && !uuid.includes("-")) {
      uuid = uuid.replace(
        /([\d\w]{8})([\d\w]{4})([\d\w]{4})([\d\w]{4})([\d\w]{12})/,
        "$1-$2-$3-$4-$5"
      );
    }
    return uuid;
  }

  function getCurrentPageId() {
    const regex = /(?:\/|-)([a-f0-9]{32})/i;
    const match = window.location.href.match(regex);
    if (match && match[1]) {
      return standardizeUUID(match[1]);
    } else {
      return null;
    }
  }

  async function getCurrentSpaceInfo() {
    id = getCurrentPageId();
    if (!id) {
      alert("Error: Not on a Notion page?");
      return;
    }
    // Get the workspace this page belongs to
    resp = await fetchNotion(
      "https://www.notion.so/api/v3/getRecordValues",
      null,
      {
        requests: [
          {
            id: id,
            table: "block",
          },
        ],
      }
    );
    json = await resp.json();
    return {
      space_id: json?.results?.[0]?.value?.space_id,
      user_id: json?.results?.[0]?.value?.permissions?.[0]?.user_id,
    };
  }

  async function getBlockIds(spaceId) {
    body = {
      type: "BlocksInSpace",
      query: "",
      filters: {
        isDeletedOnly: true,
        excludeTemplates: false,
        navigableBlockContentOnly: true,
        requireEditPermissions: false,
        includePublicPagesWithoutExplicitAccess: false,
        ancestors: [],
        createdBy: [],
        editedBy: [],
        lastEditedTime: {},
        createdTime: {},
        inTeams: [],
      },
      sort: {
        field: "lastEdited",
        direction: "desc",
      },
      limit: 1000,
      spaceId: spaceId,
      source: "trash",
    };
    resp = await fetchNotion("https://www.notion.so/api/v3/search", null, body);
    json = await resp.json();
    blockIds = json.results.map((el) => {
      return el.id;
    });
    return blockIds;
  }

  (async () => {
    const spaceInfo = await getCurrentSpaceInfo();
    blockIds = await getBlockIds(spaceInfo.space_id);

    if (blockIds.length == 0) {
      alert("Trash is empty!");
      return;
    }

    const dg = confirm(
      "Are you sure you want to delete " +
        blockIds.length +
        " blocks from workspace " +
        spaceInfo.space_id +
        "?"
    );
    if (!dg) {
      return;
    }

    resp = await fetchNotion(
      "https://www.notion.so/api/v3/deleteBlocks",
      spaceInfo,
      {
        blocks: blockIds.map((id) => {
          return {
            id: id,
            spaceId: spaceInfo.space_id,
          };
        }),
        permanentlyDelete: true,
      }
    );

    if (resp.status == 200) {
      alert("Trash emptied!");
    } else {
      alert("Error: " + resp.status + ", see console for details");
      console.log(resp);
    }
  })();
}

async function fetchNotion(url, spaceInfo, body) {
  req = {
    credentials: "include",
    headers: {
      accept: "*/*",
      "cache-control": "no-cache",
      "content-type": "application/json",
      pragma: "no-cache",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify(body),
    method: "POST",
    mode: "cors",
  };
  if (spaceInfo) {
    req.headers["x-notion-active-user-header"] = spaceInfo.user_id;
    req.headers["x-notion-space-id"] = spaceInfo.space_id;
  }
  const response = await fetch(url, req);
  return response;
}

function injectEmptyTrashButton(trashMenu) {
  const hideScrollbar = trashMenu.querySelector(".hide-scrollbar");
  const button = document.createElement("button");
  button.innerText = "Empty Trash";
  button.style = "flex-shrink: 0;";
  button.onclick = emptyTrash;
  hideScrollbar.appendChild(button);
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const trashMenu = node.querySelector(".notion-sidebar-trash-menu");
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
  subtree: true,
});
