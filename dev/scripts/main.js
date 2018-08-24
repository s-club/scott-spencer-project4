const ohHey = "Hello World";

const app = {};
window.app = app;
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
    app.artistQuery(app.artistMethods.getSimilar, artist)
        .then((res) => {
            const artist = res.similarartists.artist;
            let artistArr = artist
                .filter((artist) => artist.match >= .25)
                .map((artist) => {
                    return {
                        name: artist.name,
                        match: artist.match,
                    }
                });
            // get genre tags for the similar artists, add tags as property on artistsArr
            Promise.all([
                app.getSimilarArtistTags(artistArr),
                // get top albums for the similar artists 
                app.getSimilarArtistsTopAlbums(artistArr),
                // get top tracks for the similar artists, add tracks as property on artistsArr
                app.getSimilarArtistsTopTracks(artistArr)])
                .then(() => {

                    app.createArtistCard(artistArr)
                    $(".loadingOverlay").hide("fade", 500)
                    // console.log(artistArr)
                });
        })
}

app.getSimilarArtistTags = (array) => {
    return new Promise((res) => {
        array = array.map((item) => {
            return app.artistQuery(app.artistMethods.getTopTags, item.name)
                .then((res) => {
                    // create a variable for the tags array
                    const tags = res.toptags.tag

                    // get the artist associated with each tags array
                    const artist = app.getArtistFromRes(res.toptags)

                    // filter the tags to those who are a match >= 10, then strip them to the essential info using map
                    const tagArr = tags
                        .filter((tag) => tag.count >= 20 && tag.name !== "seen live")
                        .map((tag) => {
                            return {
                                name: tag.name,
                                relevancy: tag.count
                            }
                        })

                    // if the tag artist matches the initial array item's artist, add the tags as a property of that item
                    if (artist === item.name) {
                        item.tags = tagArr
                    }
                });
            });
        Promise.all(array)
            .then(res);
    });
}
// take an array of all the similar artists
// iterate over each artist and submit an api request using $.when for .getTopTracks
app.getSimilarArtistsTopTracks = (array) => {
    return new Promise((res) => {
        array = array.map((item) => {
            return app.artistQuery(app.artistMethods.getTopTracks, item.name, 10)
            .then((res) => {
                // console.log(res.toptracks);
                // create a variable for the tracks array
                const tracks = res.toptracks.track
    
                // get the artist associated with each tracks array
                const artist = app.getArtistFromRes(res.toptracks)
    
                // Map the array of tracks returned by the api to contain only the properties we want
                const tracksArr = tracks
                    .map((song) => {
                        
                        return {
                            name: song.name,
                            listeners: song.listeners,
                            playcount: song.playcount,
                            // dig through the the array of image objects to return only the url of the extralarge sized images
                            img: song.image
                                    .filter((img) => img.size === "extralarge")
                                    .map((img) => img["#text"]).toString(),
                        }
                    });
    
                // if the track artist matches the initial array item's artist, add tracks as a property of that item
                if (artist === item.name) {
                    item.tracks = tracksArr
                }
            });
        });
        Promise.all(array)
            .then(res);
    });
}

app.getSimilarArtistsTopAlbums = (array) => {
    return new Promise((res) => {
        array = array.map((item) => {
            return app.artistQuery(app.artistMethods.getTopAlbums, item.name, 5)
            .then((res) => {
                const artist = app.getArtistFromRes(res.topalbums);
                // console.log(artist);
                const albums = res.topalbums.album
                // Map the array of albums returned by the API to display only the content we want
                const albumArr = albums.
                map((album) => {
                    return{
                        name: album.name,
                        playcount: album.playcount,
                        image: album.image.
                        filter((img) => img.size === "extralarge").
                        map((img) => img["#text"]).toString(),
                        
                    }
                });
                // Map if album artist matches the initial array items artist
                // Add the album array as a property of that item
    
                if(artist === item.name){
                    item.albums = albumArr;
                }
    
                // console.log("artist", artist, "Item:", item.name)
            })
        })
        Promise.all(array)
            .then(res);
    });
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
        <div class="artistCard artistCard__banner" data-artist="${artist.name}">
            <div class="artistCard__name">
                <h3>${artist.name}</h3>
            </div>
            <div class="artistCard artistCard__match">
                <div class="artistCard__match artistCard__match--outerBar">
                    <div class="artistCard__match artistCard__match--innerBar" data-percentMatch="${percentMatch}">${percentMatch}%</div>
				</div>
			</div>
        </div>
        <div class="artistCard artistCard__expand">
            <div class="artistCard artistCard__tags">
                <ul></ul>
            </div>
            <div class="artistCard artistCard__tracks">
                <ul></ul>
            </div>
            <div class="artistCard artistCard__albums">
                <ul></ul>
            </div>
        </div>
        `)
    });
    // add tags to dom
    app.addPropsToDom(array, "tags")

    // add tracks to dom
    app.addPropsToDom(array, "tracks")

    // add albums to dom
    app.addPropsToDom(array, "albums")

    // make the match percent meter reflect the match value
    app.percentMatch()

}

// Function to add property to DOM
app.addPropsToDom = (array, prop) => {
    // for each artist card banner...we do the following:
    $(".artistCard__banner").each(function(){
        //  iterate through every artist in our similar artists array
        array.forEach((artist) => {
            // save the div's artist data tag
            const artistData = $(this).data('artist')
            // if the artist data tag that we are currenty iterating though matches the similar artist's name that we're iterating through find the ul it belongs to and append its name as an li
            if (artist.name === artistData) {
                artist[prop].forEach((item) => {
                    if(item.playcount !== undefined){
                        $(this).parent().find(`.artistCard__${prop} ul`).append(`<li>
                            <h4>${item.name}</h4>
                            <h4>Times played: ${item.playcount}</h4>
                        </li>`)
                    } else{
                        $(this).parent().find(`.artistCard__${prop} ul`).append(`<li>
                            <h4>${item.name}</h4>
                        </li>`)
                    }
                });
            }
        });
    })
    $(".artistCard__expand").hide(500)
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
        $(".loadingOverlay").show("fade", 500)
        // console.log(app.searchArtist);
    })

    $('.artistCardContainer').on('click', '.artistCard__banner', function(){
        console.log('ARTIST CARD BANNER CLICKED')
        const artist = $(this).data('artist')
        $(this).parent().find(".artistCard__expand").toggle("slide", {direction: "up"},500)
        // console.log(artist)
    });
};


// Initialize app
app.init = () => {
    app.events()
    $(".loadingOverlay").hide("fade", 500)

}
// Function ready
$(app.init)


// DYNAMIC MATCH SCALE - for similar artists end point, there is a match score reletive to the searched artists 0-1

// on user input - getSimilar