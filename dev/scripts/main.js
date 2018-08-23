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
app.artistQuery = (method, artist, limit) => {
    app.artistUrl = `http://ws.audioscrobbler.com/2.0/?method=artist.${method}`
    return $.ajax({
        url: app.artistUrl,
        method: 'GET',
        dataType: 'json',
        data: {
            artist,
            api_key: app.apiKey,
            limit,
            format: 'json',
        }
    })
};

// 
// create a new array of similar artist names that we can pass as the "artist value for our other api calls
app.getSimilarArtists = (artist) => {
    $.when(app.artistQuery(app.artistMethods.getSimilar, artist))
        .then((res) => {
            const artist = res.similarartists.artist;
            const artistArr = artist
                .filter((artist) => artist.match >= .25)
                .map((artist) => {
                    return {
                        name: artist.name,
                        match: artist.match,
                    }
                });
            // get genre tags for the similar artists, add tags as property on artistsArr
            app.getSimilarArtistTags(artistArr);
            // get top tracks for the similar artists, add tracks as property on artistsArr
            app.getSimilarArtistsTopTracks(artistArr);
            app.createArtistCard(artistArr)
            console.log(artistArr)
        })
}


app.getSimilarArtistTags = (array) => {
    array.forEach((item) => {
        $.when(app.artistQuery(app.artistMethods.getTopTags, item.name))
        .then((res) => {
            // create a variable for the tags array
            const tags = res.toptags.tag
            
            // get the artist associated with each tags array
            const artist = app.getArtistFromRes(res.toptags)

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

// take an array of all the similar artists
// iterate over each artist and submit an api request using $.when for .getTopTracks
app.getSimilarArtistsTopTracks = (array) => {
    array.forEach((item) => {
        $.when(app.artistQuery(app.artistMethods.getTopTracks, item.name, 10))
        .then((res) => {
            // console.log(res.toptracks);
            // create a variable for the tags array
            const tracks = res.toptracks.track

            // get the artist associated with each tags array
            // const artist = res.toptracks['@attr'].artist
            const artist = app.getArtistFromRes(res.toptracks)

            // Map the array of tracks returned by the api to contain only the properties we want
            const tracksArr = tracks
                .map((song) => {
                    
                    return {
                        track: song.name,
                        listeners: song.listeners,
                        playcount: song.playcount,
                        // dig through the the array of image objects to return only the url of the extralarge sized images
                        img: song.image
                                .filter((img) => img.size === "extralarge")
                                .map((img) => img["#text"]).toString(),
                    }
                });

            // if the tag artist matches the initial array item's artist, add the tags as a property of that item
            if (artist === item.name) {
                item.tracks = tracksArr
            }
        });
    });

    return array
}

app.getArtistFromRes = (rootObject) => {
    return rootObject['@attr'].artist
};

app.createArtistCard = (array) => {
    $('.artistCardContainer').empty()
    array.forEach((artist) => {
        // console.log(Math.floor(Number(artist.match).toFixed(2) * 100).toString());

        const artistCard = $("<section>").addClass('artistCard')
        const percentMatch = Math.floor(Number(artist.match).toFixed(2) * 100)
        $('.artistCardContainer').append(artistCard)

        $(artistCard).append(`
        <div class="artistCard__banner">
            <div class="artistCard__name">
                <h3>${artist.name}</h3>
            </div>
            <div class="artistCard__match">
                <div class="artistCard__match artistCard__match--outerBar">
                    <div class="artistCard__match artistCard__match--innerBar" data-percentMatch="${percentMatch}">${percentMatch}%</div>
				</div>
			</div>
        </div>
        <div class="artistCard__expand"></div>
        `)
    });
    app.percentMatch()
}

// A function to make the "match meter" match it's width % to it's data('percentmatch') value
app.percentMatch = () => {
    $('.artistCard__match--innerBar').each(function () {
        // console.log($(this));
        const percentMatch = $(this).data('percentmatch')
        $(this).width(`0px`)
        $(this).animate({ width: `${percentMatch}%` }, 1500, 'swing')

    });
    
};

app.events = () => {
    // e events here. form submits, clicks etc...
    $('.searchForm').on('submit', function(e){
        e.preventDefault();
        app.searchArtist = $(this).find('.searchForm__input').val();
        app.getSimilarArtists(app.searchArtist);
        // console.log(app.searchArtist);
    })
};


// Initialize app
app.init = () => {
    app.events()
    
    
    
}
// Function ready
$(app.init)


// DYNAMIC MATCH SCALE - for similar artists end point, there is a match score reletive to the searched artists 0-1

// on user input - getSimilar