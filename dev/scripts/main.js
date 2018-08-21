const ohHey = "Hello World";

const app = {};
// Last.fm similar artist api url
app.apiKey = `a57e83c492bc4a0ac36f18e47aaaf9b7`

app.artistMethods = {
    search: 'search',
    getInfo: 'getInfo',
    getSimilar: 'getSimilar',
    getTopTracks: 'getTopTracks',
    getTopAlbums: 'getTopAlbums',
    getTopTags: 'getTopTags',
}

// Function to make api calls for artists
// Param 1 - the type of call you want to make | Param 2 - the artist you're making the querying for
app.artistQuery = (method, artist) => {
    app.artistUrl = `http://ws.audioscrobbler.com/2.0/?method=artist.${method}`
    $.ajax({
        url: app.artistUrl,
        method: 'GET',
        dataType: 'json',
        data: {
            artist,
            api_key: app.apiKey,
            format: 'json',
        }
    })
};


app.events = () => {
    // e events here. form submits, clicks etc...
};


// Initialize app
app.init = () => {
    app.events()
    app.artistQuery(app.artistMethods.getSimilar, 'Radiohead')
}
// Function ready
$(app.init)


// DYNAMIC MATCH SCALE - for similar artists end point, there is a match score reletive to the searched artists 0-1

// on user input - getSimilar