# Artsy
This is a simple userscript addon for Iwara users who upload videos on the site. <br>
If you are just a regular user who doesn't upload any videos there, this addon will likely be of no use to you.

The addon offers two features.

# User interaction stats
Checks if the commenter in the comment section of a video (any video) or a poster on the forums has interacted with your content in any way, for example by liking your videos or commenting on them and it displays these stats next to their name. You can also click on that summary to get a full detailed lists of interactions for that user.
<img width="680" height="433" alt="image" src="https://github.com/user-attachments/assets/e613aa86-800c-4b88-bae2-4ac47f57993f" />

<p>
    <ul>
        <li><b>Likes</b> - Lists all likes the user has placed on your videos and shows the date when the like was placed</li>
        <li><b>Comments</b> - List of all coments the user has made udner your videos.</li>
        <li><b>Filter favorites</b> - You can store your favorite filter settings as favorites and then apply them with a single click</li>
        <li><b>Friends</b> - Shows this icon 🫂 if the suer is in your friend list</li>
        <li><b>Followers</b> - Shows this icon ☑️ if the user is following you, and date which shows since when is he following you</li>
    </ul>
</p>

# Video performance charting
Want to see how well your videos perform compared to each other? Or compared to videos from other artists? Now you can easily do that.<br>
This handy charting tool will analyze likes placed on the specified videos and then uses the opensource Chart.js library to display them in a clean line graph format.
<img width="1000" height="592" alt="image" src="https://github.com/user-attachments/assets/54d21f5a-58e1-478c-9b3a-d84634e4e0c5" />

# How it works
You fill in your username on the addon settings page and then you will be able to use the update buttons, where the addon downloads all the relevant data it needs.

<img width="531" height="150" alt="image" src="https://github.com/user-attachments/assets/7928380c-8016-4db4-bf8f-a550d36d6fe9" />

After that these data will be stored locally on your browser, so the addon will generate 0 extra server traffic during use, since it will be looking up all the data it needs in this local database. <br>
This also applies to charting, if you chart one of your own videos, it will simply use the local data and no server traffic will be generated. However, if you want you can chart video from any uploader as well, in which case the addon will simply download the missing like data, if it already doeasn't have them.

<br>
<p><b>Artsy is in no way associated with Iwara in any official capacity.</b></p>

