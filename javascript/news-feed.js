/**
 * Reference to the database.
 */
var ref = firebase.database().ref("users");

/**
 * Create and put html elements according to retrieved data
 * from database.
 */
ref.on("child_added", function(snapshot, prevChildKey) {
    var addedNews = snapshot.val();
    var name = addedNews.name;
    var quantity = addedNews.quantity;

    var rightPanel = document.getElementById("rightPanel");

    var news = document.createElement("div");
    news.className = "news";
    news.setAttribute("id", name);

    var newsHeader = document.createElement("div");
    newsHeader.className = "newsHeader";
    var newsTitle = document.createElement("div");
    newsTitle.className = "newsTitle";
    newsTitle.innerHTML = name;
    var newsDate = document.createElement("div");
    newsDate.className = "newsDate";
    newsDate.innerHTML = "0 / 0";
    newsHeader.appendChild(newsTitle);
    newsHeader.appendChild(newsDate);
    news.appendChild(newsHeader);

    var newsContent = document.createElement("div");
    newsContent.className = "newsContent";
    newsContent.innerHTML = quantity;
    news.appendChild(newsContent);

    rightPanel.appendChild(news);
});

/**
 * Remove data from html that has been removed from database.
 */
ref.on("child_removed", function(snapshot) {
    var removedNews = snapshot.val();
    var name = removedNews.name;

    var rightPanel = document.getElementById("rightPanel");
    rightPanel.removeChild(document.getElementById(name));
});
