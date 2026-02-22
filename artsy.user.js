// ==UserScript==
// @name         Artsy
// @namespace    cuckIndustries
// @version      v1.01
// @description  User stats tool for iwara.tv
// @author       Cuckdev
// @match        https://www.iwara.tv/*
// @grant        GM.info
// @icon         https://www.google.com/s2/favicons?sz=64&domain=iwara.tv
// @downloadURL  https://raw.githubusercontent.com/Cuckdev/Artsy/refs/heads/main/artsy.user.js
// @updateURL    https://raw.githubusercontent.com/Cuckdev/Artsy/refs/heads/main/artsy.user.js

// ==/UserScript==

if(!GM){ var GM = {'info': {'script': {'version': 1.0}}} } // For DEV loader script method, since GM object is not available in the injected script

(function() {
    'use strict';


    const MainPageContextWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;        
    const ApiAuthToken = localStorage.getItem("token");
    var UserData = {friends: [], followers: [], videos: []}    
    var ApiAccessToken = '';
    const ArtsyContainerElement = document.createElement('div');
    ArtsyContainerElement.id = "artsyContainer";        
    var ActivePageContainer;


/*############### MAIN PAGE CSS #################*/
    ArtsyContainerElement.innerHTML += /*html*/`
        <style>
            #artsyContainer 
            {            
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);                  
                z-index: 999999;
                border-radius: 10px;
                
                background-color: #1f2228; 
                border: 1px solid #2993e9; 
                padding: 10px;     
                display: none;      

                max-height: 90vh;
                overflow-y: auto;
                overflow-x: hidden;
            }       

        /* WINDOW STYLES */


            #artsyContainer .artsyPage
            {
                position: absolute;
                top: 20px;
                left: 50%;                
                transform: translate(-50%, 0);
                width: 600px;                    
                z-index: 9999999;
                border-radius: 10px;
                
                background-color: #1f2228; 
                border: 1px solid #2993e9; 
                padding: 10px;   
                display: none;
            }

            #artsyContainer .openWindow
            {
                cursor: pointer;
            }


            #artsyContainer #configContainer input[type=file]
            {
                display: none;
            }

            #artsyContainer .closePage
            {
                position: absolute; 
                right: 10px; 
                top: 10px;
                cursor: pointer;
            }

            #artsyContainer .argName 
            {
                color: #2993e9
            }

            #artsyContainer input[type=text], #artsyContainer input[type=number]
            {                
                background-color: #1f2228;
                color: white;
                border: 1px solid #2993e9;
                border-width: 0 2px 0 2px;
                border-radius: 10px;
                font-size: 1em;             
                margin-bottom: 5px;   
            }

            #artsyContainer input[type=text]:disabled, #artsyContainer input[type=number]:disabled
            {                
                color: grey;
            }

            #artsyContainer input[type=button]
            {                
                border: 1px solid #2993e9;
                color: white;
                background-color: #424855;
                border-radius: 5px;
                padding: 5px;
                font-weight: bold;
            }

            #artsyContainer input[type=button]:hover            
            {
                background-color: #206bd2;
            }

            #artsyContainer span.hint
            {
                border: 2px dotted white;
                border-width: 0 0 2px 0;
                cursor: help;
            }
        </style>
        `;
    ArtsyContainerElement.innerHTML += '<div class="closePage">❌</div>';
    document.body.appendChild(ArtsyContainerElement);


    ArtsyContainerElement.querySelectorAll(".closePage").forEach(element => element.addEventListener("click", e => e.target.parentElement.style.display = "none"));


/*#################### CREATE MENU BUTTON ################*/
        /**
     * Checks if the menu button to open the search window already exists in the Iwara menu, and if not, it creates it
     */
    function CreateMenuButton()
    {
        let menuElement = document.querySelector(".menu ul li");

        if(document.querySelector("#artsyMenuButton") || !menuElement)
            return;    
        
        // Menu link icon
        let menuIconElement = document.createElement('img'); 
        menuIconElement.src = "data:image/png;base64,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";
        menuIconElement.width = 32;

        // Clone existing menu link and turn it into our menu link
        let clone = menuElement.cloneNode(true); 
        clone.id = "artsyMenuButton"
        clone.querySelector('a').classList.remove("active")
        clone.querySelector('a div.text').innerHTML = "Artsy"        
        clone.querySelector("svg").replaceWith(menuIconElement)
        clone.addEventListener('click', (e) => {
            
                // Triggered if we are freshly updated the script and coming from an older version possilby
               /* if(Config.data.version < parseFloat(GM.info.script.version)) // If this is the first time using this addon, show the introduction
                {            
                    SemenDaemonContainerElement.querySelector('#changelogContainer').style.display = 'block';
                    Config.data.version = parseFloat(GM.info.script.version);
                    Config.SaveConfig();
                }*/

                
                                    

                //SemenDaemonContainerElement.style.display = (SemenDaemonContainerElement.style.display == 'block' ? 'none' : 'block');
                
                GenerateConfigPageHTML();

                e.preventDefault(); 
                e.stopImmediatePropagation()
            }, false)

        menuElement.parentNode.insertBefore(clone, menuElement.nextElementSibling);

        /*let updateIconElement = document.createElement('span');
        updateIconElement.id = "dbUpdateMenuIcon";
        updateIconElement.innerHTML = "⬇️";
        updateIconElement.style = "position: absolute; left: -20px; top: -5px; display: none";        
        menuIconElement.parentNode.appendChild(updateIconElement);
        dbUpdateMenuIconElement = updateIconElement;*/
    }

        // Give the page some time to load and then generate the menu button. Then regenerate it every time iwara script re-renders the menu
    MainPageContextWindow.addEventListener('load', e => 
            (new MutationObserver((mutationList, observer) => CreateMenuButton())).observe(document.querySelector("#app"), { attributes: true, childList: true, subtree: true, characterData: true })); // Watch when iwara's JS regenerates te menu, and remake our button               
    
    setInterval(CreateMenuButton, 500) // Sometimes the onload method doesn't work, so this is a backup



/*############### Config API + config data #################*/
    class Config
    {
        static data = {
            version: 1.0,
            showIntroduction: true,            
            lastDBUpdate: (new Date()),
            userName: '',
            userId: '',
        };
    
        /**
         * Save currently active config data into browser DB
         */
        static async SaveConfig()
        {        
            await DB.StoreStringInDB(JSON.stringify(this.data), "config");
            console.info("Config data were saved to the IndexedDB");
        }

        /**
         * Save saved config data from browser DB and override any existing
         */
        static async LoadConfig()
        {        
    
            try
            {            
                let configJson = await DB.RetrieveStringFromDB("config")

                if(configJson) 
                    this.data = JSON.parse(configJson);              

                console.info("Config data were loaded from the IndexedDB");
            }
            catch(e)
            {
                console.error("Error parsing JSON config file for Artsy");
            }                                
        }

        /**
         * Export config data as json and offer them to the user for download
         */
        static ExportConfig()
        {
            GenerateDownloadFile("ArtsyConfig-" + (new Date().toISOString().split('T')[0]), JSON.stringify(this.data))
        }

        /**
         * Import config data from a json file
         * @param {*} file Json file from which to import the config data
         */
        static async ImportConfig(file)
        {            
            new Promise((resolve, reject) => {    
                const reader = new FileReader();
                reader.onload = () => {
                    this.data = JSON.parse(reader.result);
                    console.info("Artsy's config data were imported from an external file");
                };

                reader.onloadend = () => resolve();
                reader.onerror = (event) => reject(event.target.error);
                reader.readAsText(file);        
            });
            
        }
    }


/*############### IndexedDB API #################*/
    /**
     * Collection of functions which handle interacting with the browser's indexedDB
     */
    class DB
    {
        /**
         * Connect to the indexedDB
         * @returns Active connection to the indexedDB 
         */
        static #InitDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open("ArtsyDB", 1);
        
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains("files")) {
                        const store = db.createObjectStore("files", { keyPath: "id" });
                        store.createIndex("fileName", "fileName", { unique: false });
                    }
                };
        
                request.onsuccess = (event) => resolve(event.target.result);
                request.onerror = (event) => reject(event.target.error);
            });
        }
        
        /**
         * Store a file in the IndexedDB of the browser. Large files will be split into 100MB chunks. RetrieveFileFromDB() then handles joining these chunks automatically upon retrieval.
         * @param {*} file File to store in the db, most likely file from the file picker input
         * @param {string} fileName Name under which to store the file in the DB
         * @returns Promise which resolves once the storing of the file finishes
         */
        static async StoreFileInDB(file, fileName) {
            const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
            const db = await this.#InitDB();
        
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                const fileChunks = [];
                let offset = 0;
        
                reader.onload = () => {
                    const chunk = reader.result;
                    fileChunks.push(chunk);
        
                    if (offset < file.size) {
                        offset += CHUNK_SIZE;
                        readNextChunk();
                    } else {
                        // Store chunks in IndexedDB
                        const transaction = db.transaction("files", "readwrite");
                        const store = transaction.objectStore("files");
        
                        fileChunks.forEach((chunk, index) => {
                            store.put({ id: `${fileName}-chunk-${index}`, fileName, chunk });
                        });
        
                        store.put({ id: `${fileName}-meta`, fileName, totalChunks: fileChunks.length });
                        transaction.oncomplete = () => resolve();
                        transaction.onerror = (event) => reject(event.target.error);
                    }
                };
        
                reader.onerror = (event) => reject(event.target.error);
        
                function readNextChunk() {
                    const slice = file.slice(offset, offset + CHUNK_SIZE);
                    reader.readAsArrayBuffer(slice);
                }
        
                readNextChunk();
            });
        }

        static async StoreLargeStringInDB(string, fileName) {
            const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB equivalent in characters
            const db = await this.#InitDB();
        
            return new Promise((resolve, reject) => {
                try {
                    const stringChunks = [];
                    let offset = 0;
        
                    // Split the string into chunks
                    while (offset < string.length) {
                        const chunk = string.slice(offset, offset + CHUNK_SIZE);
                        stringChunks.push(chunk);
                        offset += CHUNK_SIZE;
                    }
        
                    // Store chunks in IndexedDB
                    const transaction = db.transaction("files", "readwrite");
                    const store = transaction.objectStore("files");
        
                    stringChunks.forEach((chunk, index) => {
                        store.put({ id: `${fileName}-chunk-${index}`, fileName, chunk });
                    });
        
                    store.put({ id: `${fileName}-meta`, fileName, totalChunks: stringChunks.length });
        
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = (event) => reject(event.target.error);
                } catch (error) {
                    reject(error);
                }
            });
        }
        
        static async RetrieveFileFromDB(fileName) {
            const db = await this.#InitDB();
        
            return new Promise((resolve, reject) => {
                const transaction = db.transaction("files", "readonly");
                const store = transaction.objectStore("files");
        
                // Retrieve metadata to determine the number of chunks
                const metaRequest = store.get(`${fileName}-meta`);
                metaRequest.onsuccess = (event) => {
                    const meta = event.target.result;
                    if (!meta) return resolve(null);
        
                    const totalChunks = meta.totalChunks;
                    const chunks = [];
                    let chunksRetrieved = 0;
        
                    for (let i = 0; i < totalChunks; i++) {
                        const chunkRequest = store.get(`${fileName}-chunk-${i}`);
                        chunkRequest.onsuccess = (chunkEvent) => {
                            chunks[i] = chunkEvent.target.result.chunk;
                            chunksRetrieved++;
        
                            if (chunksRetrieved === totalChunks) {
                                // Combine chunks into a single Blob
                                const fileBlob = new Blob(chunks);
                                resolve(fileBlob);
                            }
                        };
                        chunkRequest.onerror = (event) => reject(event.target.error);
                    }
                };
        
                metaRequest.onerror = (event) => reject(event.target.error);
            });
        }
        
        static async RetrieveStringFromDB(fileName) {
            const db = await this.#InitDB();
        
            return new Promise((resolve, reject) => {
                const transaction = db.transaction("files", "readonly");
                const store = transaction.objectStore("files");
                const request = store.get(fileName);
                request.onsuccess = (event) => resolve(event.target.result?.content || null);
                request.onerror = (event) => reject(event.target.error);

            });
        }        

        /**
         * Store a simple string in the database, max size limit is around 250MB on dekstop browsers. It will not be split into chunks.
         * @param {*} string 
         * @param {*} fileName 
         * @returns 
         */
        static async StoreStringInDB(string, fileName) 
        { 
            const db = await this.#InitDB();

            return new Promise((resolve, reject) => {                            
                const transaction = db.transaction("files", "readwrite");
                transaction.addEventListener('complete', (e) => resolve())                            
                const store = transaction.objectStore("files");
            
                store.put({ id: fileName , content: string });                                
            });
        }
        
    

    }



/*############### IWARA API #################*/
    class IwaraApi
    {
        // Fetch info about the specified video by id
        static async GetUserById(username) 
        {            
            return this.ExecuteApiRequest("https://api.iwara.tv/profile/" + username);
        }       


        // Fetch info about the specified video by id
        static async GetVideoById(videoId) 
        {            
            return this.ExecuteApiRequest("https://api.iwara.tv/video/" + videoId);
        }       


        // Fetch a page of videos for the given user id
        static async GetUserVideos(userId, howMany = 50, page = 0) 
        {            
            return this.ExecuteApiRequest("https://api.iwara.tv/videos?rating=all&sort=date&page=" + page + "&user=" + userId + "&limit=" + howMany);
        }       

        /**
         * Get list of users who liked the video
         * @param {string} videoId Id of the video
         * @param {int} howMany How many likes to return, looks like api limit is 50 per request
         * @returns 
         */
        static async GetVideoLikes(videoId, howMany = 50, page = 0) 
        {            
            return this.ExecuteApiRequest("https://api.iwara.tv/video/" + videoId + "/likes?page=" + page + "&limit=" + howMany);
        } 

        static async GetVideoComments(videoId, howMany = 50, page = 0, parentCommentId = "") 
        {            
            
            return this.ExecuteApiRequest("https://api.iwara.tv/video/" + videoId + "/comments?" + (parentCommentId ? ("parent=" + parentCommentId + "&") : "") + "page=" + page + "&limit=" + howMany);
        }       

        /**
         * Fetch a list of users following the given user
         * @param {string} userId User id
         * @param {int} page Which page of followers to get
         * @returns JS promise to resolve the json
         */
        static async GetFollowers(userId, page = 0) 
        {        
            return this.ExecuteApiRequest("https://api.iwara.tv/user/" + userId + "/followers?page=" + page);
        }    

                /**
         * Fetch a list of users following the given user
         * @param {string} userId User id
         * @param {int} page Which page of friends to get
         * @returns JS promise to resolve the json
         */
        static async GetFriends(userId, page = 0) 
        {        
            return this.ExecuteApiRequest("https://api.iwara.tv/user/" + userId + "/friends?page=" + page);                
        }  

        /**
         * Executes a GET API request and returns the parsed JSON response.
         * Automatically retries the request when it fails (network errors,
         * timeouts, or retryable HTTP status codes such as 429, 5xx).
         *
         * @param {string} url
         *   Full request URL.
         *
         * @param {Object} [options]
         *   Optional configuration for retry behavior.
         *
         * @param {number} [options.maxRetries=3]
         *   Number of retries after the initial attempt.
         *
         * @param {number} [options.retryDelay=1000]
         *   Initial delay (in milliseconds) before retrying a failed request.
         *
         * @param {number} [options.backoff=2]
         *   Exponential backoff multiplier applied to the retry delay.
         *
         * @param {number} [options.timeout]
         *   Optional timeout (in milliseconds) for each individual request.
         *
         * @returns {Promise<Object>}
         *   Promise that resolves to the parsed JSON response once the request
         *   succeeds, or rejects after all retry attempts fail.
         */
        static async ExecuteApiRequest(url, { maxRetries = 3, retryDelay = 1000, backoff = 2, timeout } = {}) 
        {
            const headers = {
                'Authorization': 'Bearer ' + ApiAccessToken,
                'Content-Type': 'application/json',
            };

            const isRetryableStatus = (status) => [429, 500, 502, 503, 504].includes(status);

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    // Optional per-request timeout
                    const controller = typeof timeout === 'number' ? new AbortController() : null;
                    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;

                    const response = await fetch(url, {
                        method: 'GET',
                        headers,
                        signal: controller ? controller.signal : undefined,
                    });

                    if (timer) clearTimeout(timer);

                    if (!response.ok) {
                        // capture some body text for debugging (best-effort)
                        let body = null;
                        try { body = await response.text(); } catch (e) { /* ignore */ }
                        const err = new Error(`HTTP ${response.status} ${response.statusText}${body ? ` - ${body.slice(0, 200)}` : ''}`);
                        err.status = response.status;
                        throw err;
                    }

                    // success: return parsed JSON
                    return await response.json();
                } catch (err) {
                    // decide whether to retry
                    const isAbort = err.name === 'AbortError' || err.message === 'Request timed out';
                    const status = err.status;
                    const retryable = isAbort || (status ? isRetryableStatus(status) : true);

                    // if this was final attempt or not retryable -> rethrow a clear error
                    if (attempt === maxRetries || !retryable) {
                        //throw new Error(`Request to ${url} failed after ${attempt + 1} attempt(s): ${err.message}`);
                        return null;
                    }

                    // wait before next retry (exponential backoff + jitter)
                    const baseDelay = retryDelay * Math.pow(backoff, attempt);
                    const jitter = Math.random() * 0.5; // up to +50%
                    const delay = Math.floor(baseDelay * (1 + jitter));
                    await new Promise(res => setTimeout(res, delay));
                    // then loop to retry
                }
            }
        }



        /**
         * Use the stored iwara auth token to get a token for api access
         */
        static async GetAccessToken()
        {
            if(!ApiAuthToken)
                return;

            return fetch("https://api.iwara.tv/user/token", {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + ApiAuthToken,
                    'Content-Type': 'application/json',
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    
                    return response.json(); // Parse JSON
                })
                    .then(parsedJson => {                        
                            return parsedJson.accessToken
                        });

        }
    }

    // Redownload list of friends for the user
    async function UpdateFriends(progressElement) 
    {        
        let page = 0;
        let pageData;
        UserData.friends.length = 0;

        progressElement.innerHTML = 'Fetching friends...'
        ArtsyContainerElement.style.pointerEvents = 'none';

        
        while(pageData = await IwaraApi.GetFriends(Config.data.userId, page))
        {
            if (!pageData.results || pageData.results.length == 0)
                break;            

            console.log("Fetched friend page " + page);
            UserData.friends.push(...pageData.results);
            progressElement.innerHTML = `🫂<b>${UserData.friends.length}</b>`

            page++;
        }       

        DB.StoreLargeStringInDB(JSON.stringify(UserData), 'userContentDatabase');

        progressElement.innerHTML = `Done. Total friends fetched: <b>${UserData.friends.length}</b>`
        ArtsyContainerElement.style.pointerEvents = 'auto';


    }

    // Redownload list of users following the user
    async function UpdateFollowers(progressElement) 
    {
        let page = 0;
        let pageData;
        UserData.followers.length = 0;

        progressElement.innerHTML = 'Fetching followers...'
        ArtsyContainerElement.style.pointerEvents = 'none';

        
        while(pageData = await IwaraApi.GetFollowers(Config.data.userId, page))
        {
            if (!pageData.results || pageData.results.length == 0)
                break;

            console.log("Fetched follower page " + page);
            UserData.followers.push(...pageData.results);
            progressElement.innerHTML = `☑️<b>${UserData.followers.length}</b>`


            page++;
        }       

        DB.StoreLargeStringInDB(JSON.stringify(UserData), 'userContentDatabase');

        progressElement.innerHTML = `Done. Total followers fetched: <b>${UserData.followers.length}</b>`
        ArtsyContainerElement.style.pointerEvents = 'auto';
    }

    // Redownload list of all videos of the user, their comments and likes (on those videos)
    async function UpdateVideoData(progressElement) 
    {        
        let videoPage = 0;
        let videoCatalogPageData;
        UserData.videos.length = 0;   

        progressElement.innerHTML = 'Fetching video data...'
        ArtsyContainerElement.style.pointerEvents = 'none';

                    
        while(videoCatalogPageData = await IwaraApi.GetUserVideos(Config.data.userId, 50, videoPage))
        {
            if (!videoCatalogPageData.results || videoCatalogPageData.results.length == 0)
                break;

            for (const videoData of videoCatalogPageData.results) 
            {            
                let combinedVideoData = {video: [], comments: [], likes: []};                
                combinedVideoData.video = videoData;

                let likesPage = 0;
                let likePageData;
                

                while(likePageData = await IwaraApi.GetVideoLikes(videoData.id, 50, likesPage))
                {
                    if (!likePageData.results || likePageData.results.length == 0)
                        break;

                
                    for(const likeData of likePageData.results)                        
                        likeData.videoId = videoData.id;                
                    
                    combinedVideoData.likes.push(...likePageData.results);
                    console.log("Fetched likes  page " + likesPage);
                    progressElement.innerHTML = `📽️${UserData.videos.length}: ${TruncateText(combinedVideoData.video.title, 20)}  🩷<b>${combinedVideoData.likes.length}</b> 🗨️0 `;

                    
                    likesPage++;
                }   

                let commentsPage = 0;
                let commentsPageData;

                while(commentsPageData = await IwaraApi.GetVideoComments(videoData.id, 50, commentsPage))
                {
                    if (!commentsPageData.results || commentsPageData.results.length == 0)
                        break;

                    combinedVideoData.comments.push(...commentsPageData.results)

                    // Check if any comment has replies and if yes fetch them as well
                    for (const commentData of commentsPageData.results) 
                    {
                        if(commentData.numReplies <= 0)
                            continue;

                        let subCommentsPage = await IwaraApi.GetVideoComments(videoData.id, 50, 0, commentData.id);

                        for(const subCOmmentData of subCommentsPage.results)
                        {
                            subCOmmentData.parentCommentId = commentData.id;
                            subCOmmentData.videoId = videoData.id;
                        }
                    
                        combinedVideoData.comments.push(...subCommentsPage.results);
                        console.log("Fetched replies to comment ");
                        
                        progressElement.innerHTML = `📽️<b>${UserData.videos.length}</b>: ${TruncateText(combinedVideoData.video.title, 20)}  🩷<b>${combinedVideoData.likes.length}</b> 🗨️<b>${combinedVideoData.comments.length}</b>`;

                    }

                    console.log("Fetched comments  page " + commentsPage);
                    
                    commentsPage++;
                }   

                UserData.videos.push(combinedVideoData)
                
            }

            console.log("Fetched video catalog page " + videoPage)
            

            videoPage++;
        }     
        
        DB.StoreLargeStringInDB(JSON.stringify(UserData), 'userContentDatabase');
        progressElement.innerHTML = `Done. data fetched for <b>${UserData.videos.length}</b> videos`
        ArtsyContainerElement.style.pointerEvents = 'auto';
    }

    function TruncateText(str, max = 200) 
    {
        if (str.length <= max) 
            return str;

        const cut = str.slice(0, max);
        const lastSpace = cut.lastIndexOf(" ");

        return cut.slice(0, lastSpace > 0 ? lastSpace : max) + "...";
    }

    
    // Generate contents of the user info page pop up, showing all the info we have about the user in relation to us
    function GenerateUserInfoHTML(userName)
    {
        if(ActivePageContainer && ActivePageContainer.parentElement)
            ActivePageContainer.parentElement.removeChild(ActivePageContainer)
        
        ArtsyContainerElement.style.display = 'block';
        
        ActivePageContainer = document.createElement('div');

        let likesData = GetLikeData(userName);
        let likesHtml = '';

        if(!likesData || likesData.length == 0)
            likesHtml = 'No likes found from this user'
        else
        {            
            likesData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            for(const likeData of likesData)
            {
                let videoData = GetVideoDataById(likeData.videoId);
                likesHtml += `<li><a href="/video/${likeData.videoId}" target="_blank">${videoData.video.title}</a> - ${new Date(likeData.createdAt).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric", hour12: false })}</li>`;
            }

            likesHtml = `<ul>${likesHtml}</ul>`;
        }

        let commentsData = GetCommentsData(userName);
        let commentsHtml = '';
        
        if(!commentsData || commentsData.length == 0)
            commentsHtml = 'No comments found from this user'
        else
        {            
            commentsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            for(const commentData of commentsData)
            {
                let videoData = GetVideoDataById(commentData.videoId);
                commentsHtml += `<li title="${commentData.body}"><a href="/video/${commentData.videoId}" target="_blank">${videoData.video.title}</a> - ${new Date(commentData.createdAt).toLocaleString("en-GB", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric", hour12: false })}
                <br>&nbsp;&nbsp; ${(commentData.parentCommentId ? '®️' : '')} ${TruncateText(commentData.body, 100)}</li>`;
            }

            commentsHtml = `<ul>${commentsHtml}</ul>`;
        }
        
        let followerData = GetFollowerData(userName);
        let isFollower = followerData ? `<span title="This user follows you">☑️ ${(new Date(followerData.createdAt).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }))}</span>` : '';
         

        let friendData = GetFriendData(userName);
        let isFriend = friendData ? '<span title="You are frens with this user">🫂</span>' : '';

        ActivePageContainer = document.createElement('div');

        ActivePageContainer.innerHTML =   `<div style="text-align: center; font-weight: bold; margin-bottom: 5px">${userName} ${isFriend} ${isFollower}</div>
        <div style="font-weight: bold">🩷 Likes (${likesData.length})</div>
        ${likesHtml}

        <div style="font-weight: bold; margin-top: 10px;">🗨️ Comments (${commentsData.length})</div>
        ${commentsHtml}`;

        ArtsyContainerElement.appendChild(ActivePageContainer)
    }

    // Intercept FETCH requests the page makes, so we know when to refresh the extra info we added to the page
    function ApiCallInterceptSetup() 
    { 
        const originalFetch = MainPageContextWindow.fetch;
        
        // Prevent double-hooking
        if (MainPageContextWindow.fetch.__commentApiHooked) return;
        MainPageContextWindow.fetch.__commentApiHooked = true;

        MainPageContextWindow.fetch = async function (...args) {
            const response = await originalFetch.apply(this, args);

            try {
            const url = response.url;

            // Match: api.<anything>/comments?
            // Example: api.v1/comments?x=123            

            if (/apiq?\..*\/comments\?/.test(url) || /apiq?\..*\?page=/.test(url)) {
                // Clone so we don't consume the body
                const clone = response.clone();

                // Create a promise that resolves to JSON
                const jsonPromise = (async () => {
                const contentType = clone.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    throw new Error('Response is not JSON');
                }
                return await clone.json();
                })();

                // Dispatch event with URL + JSON promise
                document.dispatchEvent(
                new CustomEvent('commentApiCall', {
                    detail: {
                    url,
                    json: jsonPromise
                    }
                })
                );
            }
            } catch (err) {
            console.error('commentApi fetch hook error:', err);
            }

            return response;
        };
    }


    /**
 * Handle loading of the content database
 */
    async function TryLoadDatabase()
    {


        let databaseBlobText = await (await DB.RetrieveFileFromDB("userContentDatabase"))?.text();

        if(databaseBlobText)
            UserData = JSON.parse(databaseBlobText);    
            //UserData = videosList.concat(JSON.parse(databaseBlobText))    

        
       /* videosList.forEach(videoData => { // Convert date strings in the content database into Date objects
            if(!(videoData.created instanceof Date))
                videoData.created = new Date(videoData.created);
        })*/


    }

    // Retrieve data about specific video by Id, if we have that video on our local data collection
    function GetVideoDataById(videoId)
    {
        return UserData.videos.find(video => video.video.id == videoId);
    }

    // Check if the user is a follower and if yes return data about him
    function GetFollowerData(userName)
    {
        return UserData.followers.find(follower => follower.follower.username == userName);
    }
        
    // Fetch the friend record for the specified user, if it exists
    function GetFriendData(userName)
    {
        return UserData.friends.find(friend => friend.username == userName);
    }

    // Fetch all likes from the specified user from our user data collection
    function GetLikeData(userName)
    {
        return UserData.videos.flatMap(obj => obj.likes || [])  // get all likes from each object
                .filter(like => like.user.username == userName); // keep only matching username
    }

    // Fetch all comments from the specified user from our user data collection
    function GetCommentsData(userName)
    {
        return UserData.videos.flatMap(obj => obj.comments || [])  // get all likes from each object
                .filter(comment => comment.user.username == userName); // keep only matching username
    }

    // Take user element from the webpage and add extra stats numbers to it, if we have them
    function EmbellishUserElements(userElement)
    {    
        const userName = userElement.href.match(/\/profile\/(.+)$/)?.[1];        
        let isForumPage = window.location.href.includes('forum');

        let extrasContainerElement = Object.assign(document.createElement('span'), {
            style: "margin: 0 5px 0 5px; cursor: default;" + (isForumPage ? 'zoom: 0.6' : ''),
            classList: "artsyExtrasContainer"
        });       
        
        extrasContainerElement.addEventListener('click', (e) => {GenerateUserInfoHTML(userName)});
        
        const followerData = GetFollowerData(userName);

        if(followerData)
        {        
            let followedByElement = Object.assign(document.createElement('span'), {
                innerHTML: "☑️ " + (new Date(followerData.createdAt).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' })),
                style: "margin: 0 5px 0 5px; cursor: default",
                title: "Follows you since"            
            });                

            extrasContainerElement.appendChild(followedByElement)            
        }            

        const friendData = GetFriendData(userName);

        if(friendData)
        {
            let friendElement = Object.assign(document.createElement('span'), {
                innerHTML: "🫂",
                style: "margin-right: 5px; cursor: default",
                title: "You are frens with this user"
                
            });

            extrasContainerElement.appendChild(friendElement)

        }

        const commentData = GetCommentsData(userName);

        if(commentData && commentData.length > 0)
        {

            let commentedElement = Object.assign(document.createElement('span'), {
                innerHTML: "🗨️" + commentData.length,
                style: "margin-right: 5px; cursor: default",
                title: "Left this many comments on your videos"
                
            });

            extrasContainerElement.appendChild(commentedElement)
        }
        

        

        let likeData = GetLikeData(userName);

        if(likeData && likeData.length > 0)
        {
            let likedElement = Object.assign(document.createElement('span'), {
                innerHTML: "🩷" + likeData.length,
                style: "margin-right: 5px; cursor: default",
                title: "Liked this many of your videos"
                
            });

            extrasContainerElement.appendChild(likedElement)
        }

        

        
        
        
        
        
        userElement.after(extrasContainerElement);
        
    }

/********************* CHART ANALYTICS ********************/    
    let ChartLibsLoaded = false;
    let Chart;

    async function LoadChartLibsV4() {
        // 1) Load Chart.js v4 UMD build
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load Chart.js v4'));
            document.head.appendChild(s);
        });

        // 2) Load date-fns browser bundle
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/date-fns@3.6.0/cdn.min.js';
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load date-fns'));
            document.head.appendChild(s);
        });

        // 3) Load the Chart.js date-fns adapter
        await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3/dist/chartjs-adapter-date-fns.bundle.min.js';
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load chartjs-adapter-date-fns'));
            document.head.appendChild(s);
        });

        ChartLibsLoaded = true;

        Chart =  (typeof unsafeWindow !== 'undefined' && unsafeWindow.Chart) || window.Chart;
    }

    // Setup the chart library object with the data to chart
    // chartSegmentAmount - if chart type is set to days, then this will be how many days of likes to map and show. 
    // chartTimeFrame - 0 absolute time maping on the chart, 1 - map by days, 2 map by hours, 3 map by minutes
    async function GenerateLikesAnalyticsChartV4(likeCollections, chartSegmentAmount = 24, chartTimeFrame = 1) 
    {
        if (typeof Chart === 'undefined') {
            if (typeof LoadChartLibsV4 === 'function') {
                await LoadChartLibsV4();
            } else {
                throw new Error('Chart library not loaded and LoadChartLibsV4 not available');
            }
        }

        const containerElement = document.createElement('div');

        if (
            !Array.isArray(likeCollections) ||
            likeCollections.every(e => !e || !Array.isArray(e.likes) || e.likes.length === 0)
        ) {
            containerElement.textContent = 'No likes to display.';
            return containerElement;
        }

        const canvas = document.createElement('canvas');
        containerElement.appendChild(canvas);

        const graphLinesPalette = [
            'rgba( 75, 192, 192, 1)', 'rgba(255, 159,  64, 1)', 'rgba(255,  99, 132, 1)',
            'rgba(153, 102, 255, 1)', 'rgba( 54, 162, 235, 1)', 'rgba(255, 205,  86, 1)',
            'rgba( 46, 204, 113, 1)', 'rgba(231,  76,  60, 1)', 'rgba(155,  89, 182, 1)',
            'rgba( 26, 188, 156, 1)', 'rgba(241, 196,  15, 1)', 'rgba( 41, 128, 185, 1)',
            'rgba(230, 126,  34, 1)', 'rgba(142,  68, 173, 1)', 'rgba( 39, 174,  96, 1)',
            'rgba(192,  57,  43, 1)', 'rgba( 22, 160, 133, 1)', 'rgba(243, 156,  18, 1)',
            'rgba( 52, 152, 219, 1)', 'rgba(233,  30,  99, 1)'
        ];

        const config = {
            type: 'line',
            data: { datasets: [] },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: { mode: 'nearest', intersect: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Total Likes' }
                    }
                }
            }
        };

        const MS_PER_MINUTE = 1000 * 60;
        const MS_PER_HOUR   = MS_PER_MINUTE * 60;
        const MS_PER_DAY    = MS_PER_HOUR * 24;
        const unitNames     = { 1: 'Day', 2: 'Hour', 3: 'Minute' };

        /* ============================================================
        BINNED (CATEGORY) MODE
        ============================================================ */
        if (chartSegmentAmount > 0 && (chartTimeFrame === 1 || chartTimeFrame === 2 || chartTimeFrame === 3)) {
            const MS_PER_UNIT =
                chartTimeFrame === 1 ? MS_PER_DAY :
                chartTimeFrame === 2 ? MS_PER_HOUR :
                MS_PER_MINUTE;

            const unitLabel = unitNames[chartTimeFrame];

            const labels = Array.from(
                { length: chartSegmentAmount },
                (_, i) => `${unitLabel} ${i + 1}`
            );

            config.data.labels = labels;

            config.options.scales.x = {
                type: 'category',
                title: { display: true, text: `${unitLabel} Number` }
            };

            likeCollections.forEach((entry, idx) => {
                const { video, likes } = entry;
                if (!Array.isArray(likes) || likes.length === 0) return;

                const dates = likes
                    .map(l => new Date(l.createdAt))
                    .filter(d => !isNaN(d))
                    .sort((a, b) => a - b);

                if (!dates.length) return;

                const startDate = new Date(dates[0]);
                if (chartTimeFrame === 1) startDate.setHours(0, 0, 0, 0);
                else if (chartTimeFrame === 2) startDate.setMinutes(0, 0, 0);
                else startDate.setSeconds(0, 0);

                const startMs = startDate.getTime();

                const binIdxs = dates
                    .map(d => Math.floor((d.getTime() - startMs) / MS_PER_UNIT) + 1)
                    .filter(i => i >= 1 && i <= chartSegmentAmount);

                const data = labels.map((_, bin) =>
                    binIdxs.filter(i => i <= bin + 1).length
                );

                config.data.datasets.push({
                    label:
                        (TruncateText(video?.title, 25) ?? `Series ${idx}`) +
                        (video?.createdAt
                            ? ` ${new Date(video.createdAt).toISOString().slice(0, 10).replaceAll("-", "/")}`
                            : ''),
                    data,
                    borderColor: graphLinesPalette[idx % graphLinesPalette.length],
                    backgroundColor: graphLinesPalette[idx % graphLinesPalette.length],
                    fill: false,
                    tension: 0.1,
                    pointRadius: 2
                });
            });

        /* ============================================================
        RAW TIME SCALE MODE
        ============================================================ */
        } else {
            config.options.scales.x = {
                type: 'time',
                time: {
                    tooltipFormat: 'yyyy-MM-dd HH:mm',
                    unit: 'day',
                    displayFormats: {
                        day: 'yyyy-MM-dd',
                        hour: 'yyyy-MM-dd HH:mm',
                        minute: 'HH:mm'
                    }
                },
                title: { display: true, text: 'Time' }
            };

            likeCollections.forEach((entry, idx) => {
                const { video, likes } = entry;
                if (!Array.isArray(likes) || likes.length === 0) return;

                const points = likes
                    .map(l => new Date(l.createdAt))
                    .filter(d => !isNaN(d))
                    .sort((a, b) => a - b)
                    .map((dt, i) => ({
                        x: dt.toISOString(),
                        y: i + 1 // cumulative
                    }));

                if (!points.length) return;

                config.data.datasets.push({
                    label:
                        (TruncateText(video?.title, 25) ?? `Series ${idx}`) +
                        (video?.createdAt
                            ? ` ${new Date(video.createdAt).toISOString().slice(0, 10).replaceAll("-", "/")}`
                            : ''),
                    data: points,
                    borderColor: graphLinesPalette[idx % graphLinesPalette.length],
                    backgroundColor: graphLinesPalette[idx % graphLinesPalette.length],
                    fill: false,
                    tension: 0.1,
                    pointRadius: 2
                });
            });
        }

        if (canvas._chartInstance?.destroy) {
            canvas._chartInstance.destroy();
        }

        const ctx = canvas.getContext('2d');
        const chartInstance = new Chart(ctx, config);

        canvas._chartInstance = chartInstance;
        containerElement._chart = chartInstance;

        return containerElement;
    }

    // Generate contents of the like charting page
    async function GenerateLikesAnalyticsChartHTML()
    {
        if(ActivePageContainer)
            ActivePageContainer.parentElement.removeChild(ActivePageContainer);

        ActivePageContainer = document.createElement('div');
        ActivePageContainer.style = "width: 1000px;"
        ArtsyContainerElement.style.display = 'block';


        
        let chartControls = document.createElement('div')
        chartControls.innerHTML = `<div style="font-size: 0.5em; color: gray; text-align: right">Double click chart to enter/exit fullscreen</div>
            <input type="button" value="Minutes" id="chartView_Minutes"> 
            <input type="button" value="Hours" id="chartView_Hours"> 
            <input type="button" value="Days" id="chartView_Days">
            Segments: <input type="number" step="1" min=10 max=999 value="40" placeholder="40" style="width: 60px" id="chartView_Segments" title="Amount of X axis segments on the chart (for example hours)">`;

        let chatViewsMinutesElement = chartControls.querySelector("#chartView_Minutes");
        let chatViewsHoursElement = chartControls.querySelector("#chartView_Hours");
        let chatViewsDaysElement = chartControls.querySelector("#chartView_Days");
        let chatViewsSegmentsElement = chartControls.querySelector("#chartView_Segments");

        let chartDataPrepHtml = document.createElement('div');
        chartDataPrepHtml.innerHTML = `<input type="text" placeholder="videoId1,videoId2,videoId3" id="chartVideoIds" style="width: 95%;" title="Any videos we already have like data for, will be graphed from this cached data for better efficiency\nYou can add or remove videos from the chart at any time by editing this field\nDownloaded data (except for your own videos) will be lost upon page reload">
        <br>Max likes: <input type="number" step="100" min=100 max=100000 value="2000" placeholder="2000" style="width: 80px" id="chartMaxLikes" title="Maximum amount of likes per video to gather">   
        <input type="button" value="Add yours" id="chartAddYours"> 
        <input type="button" value="Chart selected data" id="chartStart"> <span style="font-style: italic; font-size: 10px; color: gray; float: right">Note: It is no longer possible to chart any likes older than 2026, <br>since Iwara was not able to recover like timestamps, when they switched hostings.</span>

        <div id="chartProgressBar"></div>`;

        let chartVideoIdsElement = chartDataPrepHtml.querySelector("#chartVideoIds");
        let chartStartElement = chartDataPrepHtml.querySelector("#chartStart");
        let chartProgressBarElement = chartDataPrepHtml.querySelector("#chartProgressBar");
        let chartMaxLikesElement = chartDataPrepHtml.querySelector("#chartMaxLikes");
        
        chartDataPrepHtml.querySelector("#chartAddYours").addEventListener('click', (e) => {
            if(UserData.videos.length == 0)
                return;

            if(chartVideoIdsElement.value)
                chartVideoIdsElement.value += ',';

            chartVideoIdsElement.value += UserData.videos.map(video => video.video.id).join(',');
        });



        ActivePageContainer.appendChild(chartDataPrepHtml);
        let chartContainer;
        let activeViewType = 1;
        let chartLikeArray = [];

        let regenerateChart = async (viewType) => {

            if(!chartLikeArray)
                return;

            viewType = viewType ? viewType : activeViewType;
            activeViewType = viewType;

            if(chartContainer && chartContainer.parentElement)
                chartContainer.parentElement.removeChild(chartContainer);

            chartContainer = await GenerateLikesAnalyticsChartV4(chartLikeArray, chatViewsSegmentsElement.value, viewType);
            //chartContainer.style = "width: 1000px; height: 1000px;"

            if(!chartContainer.firstElementChild)
                return;            

            chartContainer.firstElementChild.addEventListener('dblclick', () => {
                if (document.fullscreenElement === chartContainer) {
                    document.exitFullscreen();
                } else {
                    chartContainer.requestFullscreen();
                }
                });

                chartContainer.appendChild(chartControls)
                ActivePageContainer.appendChild(chartContainer)

        }

        chartStartElement.addEventListener('click', async (e) => {
            if(!chartVideoIdsElement.value)
                return;
            
            chartVideoIdsElement.disabled = true;
            let videoIdsToChart = chartVideoIdsElement.value.split(',');
            let videosMatchingOurUserDb = Array.from(new Map(UserData.videos.concat(chartLikeArray).map(v => [v.video.id,v])).values()).filter(v => videoIdsToChart.includes(v.video.id)); // Check if we already have likes data for any of the videos the user wants to graph
            let videosIdsToDownload = videoIdsToChart.filter(vid => !videosMatchingOurUserDb.some(vd => vd.video.id == vid)); // We don't have data available for these video IDs, so we need to grab them
            
            chartLikeArray = videosMatchingOurUserDb;
            
            
            for(const videoId of videosIdsToDownload)
            {
                
                let videoData = await IwaraApi.GetVideoById(videoId);                
                
                if(typeof videoData != 'object' || videoData == null)
                    continue;                                     
                
                let combinedVideoData = {video: videoData, likes: []};                                
                let likesPage = 0;
                let likePageData;
                                
                while(likePageData = await IwaraApi.GetVideoLikes(videoData.id, 50, likesPage))
                {
                    chartProgressBarElement.innerHTML = `Gathered <b>${combinedVideoData.likes.length}</b> likes for ${TruncateText(videoData.title, 50)}`;

                    if (!likePageData.results || likePageData.results.length == 0)
                        break;
                
                    for(const likeData of likePageData.results)                        
                        likeData.videoId = videoData.id;                
                    
                    combinedVideoData.likes.push(...likePageData.results)
                    console.log(`Fetched likes page ${likesPage} for video ${videoData.slug}`)
                    
                    likesPage++;

                    if(combinedVideoData.likes.length > Number(chartMaxLikesElement.value))
                        break;
                }  

                chartLikeArray.push(combinedVideoData);
            }

            chartProgressBarElement.innerHTML = '';
            
            regenerateChart()
            chartVideoIdsElement.disabled = false;
        });

        chatViewsSegmentsElement.addEventListener('blur', (e) => {regenerateChart()});
        chatViewsMinutesElement.addEventListener('click', (e) => {regenerateChart(3)});
        chatViewsHoursElement.addEventListener('click', (e) => {regenerateChart(2)});
        chatViewsDaysElement.addEventListener('click', (e) => {regenerateChart(1)});                
        
        
        
        ArtsyContainerElement.appendChild(ActivePageContainer);


    }

    // Generate contents of the artsy config page
    async function GenerateConfigPageHTML() 
    {
        if(ActivePageContainer)
            ActivePageContainer.parentElement.removeChild(ActivePageContainer);

        ActivePageContainer = document.createElement('div');
        ActivePageContainer.style = "width: 1000px;"

        ActivePageContainer.innerHTML =  `User name:  <input type="text" placeholder="@username" id="artsyUsername" title="Your artist username, not your display name, the one with the @ in front of it."> <br>
        <input type="button" value="Update Friends" id="artsyUpdateFriends"> <span></span> |
        <input type="button" value="Update Followers" id="artsyUpdateFollowers"> <span></span> |
        <input type="button" value="Update Videos" id="artsyUpdateVideos"> <span></span> 
        <hr>
        <a style="cursor: pointer" id="artsyLikeChartingMenuButton">Video like charting</a> `;
        
        let usernameElement = ActivePageContainer.querySelector('#artsyUsername');
        let updateFriendsButtonElement = ActivePageContainer.querySelector('#artsyUpdateFriends');
        let updateFollowersButtonElement = ActivePageContainer.querySelector('#artsyUpdateFollowers');
        let updateVideosButtonElement = ActivePageContainer.querySelector('#artsyUpdateVideos');
        let artsyLikeChartingMenuButtonElement = ActivePageContainer.querySelector('#artsyLikeChartingMenuButton');

        artsyLikeChartingMenuButtonElement.addEventListener('click', GenerateLikesAnalyticsChartHTML);
        

        usernameElement.value = Config.data.userName;

        usernameElement.addEventListener('blur', async (e) => {            
            if(!e.target.value)
                return;
            ActivePageContainer.style.pointerEvents = 'none';
            e.target.disabled = true;

            Config.data.userName = e.target.value.replace('@', '');
            Config.data.userId = (await IwaraApi.GetUserById(Config.data.userName)).user.id;
            Config.SaveConfig();     
            
            e.target.disabled = false;
            ActivePageContainer.style.pointerEvents = 'auto';            
        })        

        updateFriendsButtonElement.addEventListener('click', (e) => UpdateFriends(updateFriendsButtonElement.nextElementSibling));
        updateFollowersButtonElement.addEventListener('click', (e) => UpdateFollowers(updateFollowersButtonElement.nextElementSibling));
        updateVideosButtonElement.addEventListener('click', (e) => UpdateVideoData(updateVideosButtonElement.nextElementSibling));

        ArtsyContainerElement.style.display = 'block';
        ArtsyContainerElement.appendChild(ActivePageContainer);
        
    }

        // Load stored settings for Artsy
    (async () => {               

        ApiCallInterceptSetup();        

        // Gets called every time the page does fetch request to the Api to load comments
       document.addEventListener('commentApiCall', async (e) => {
        try {            
            const { url, json } = e.detail;
            const commentData = await json; 
            
            setTimeout((e)=>{
                // Remove all the current extras
                document.querySelectorAll("span.artsyExtrasContainer").forEach(el => {            
                    el.parentElement.removeChild(el);
                });

                //let pageUserLinks = document.querySelectorAll('div.comments a.username[href*="/profile/"]');
                let pageUserLinks = document.querySelectorAll('a.username[href*="/profile/"]');
                pageUserLinks.forEach(EmbellishUserElements);                
            }, 300);

        } catch (err) {
            console.error('Failed to read comment JSON:', err);
        }
        });

        await Config.LoadConfig();                             
        ApiAccessToken = await IwaraApi.GetAccessToken();           
        await TryLoadDatabase();

        
        //if(Config.data.showIntroduction) // If this is the first time using this addon, show the introduction
            //ArtsyContainerElement.querySelector('#introductionContainer').style.display = 'block';

        console.log(UserData);                        
        
        
    })();

})();