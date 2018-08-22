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
    return $.ajax({
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

// 
// create a new array of similar artist names that we can pass as the "artist value for our other api calls
app.getSimilarArtists =
$.when(app.artistQuery(app.artistMethods.getSimilar, "Local Natives"))
.then((res) => {
    const artist = res.similarartists.artist;
    const artistArr = artist
        .filter((artist) => artist.match >= .25)
        .map((artist) => {
            return {
                name: artist.name,
                match: artist.match
            }
        });
        app.getSimilarArtistTags(artistArr)
        console.log(artistArr)
})

app.getSimilarArtistTags = (array) => {
    array.forEach((item) => {
        $.when(app.artistQuery(app.artistMethods.getTopTags, item.name))
        .then((res) => {
            // create a variable for the tags array
            const tags = res.toptags.tag
            
            // get the artist associated with each tags array
            const artist = res.toptags['@attr'].artist

            // filter the tags to those who are a match >= 10, then strip them to the essential info using map
            const tagArr = tags
                .filter((tag) => tag.count >= 10)
                .map((tag) => {
                    return {
                        name: tag.name,
                        count: tag.count
                    }
                })
            
            // if the tag artist matches the initial array item's artist, add the tags as a property of that item
            if(artist === item.name){
                item.tags = tagArr
            }
        })
    });
    return array
}

app.events = () => {
    // e events here. form submits, clicks etc...
};


// Initialize app
app.init = () => {
    app.events()
    app.getSimilarArtists;
    
    
}
// Function ready
$(app.init)


// DYNAMIC MATCH SCALE - for similar artists end point, there is a match score reletive to the searched artists 0-1

// on user input - getSimilar