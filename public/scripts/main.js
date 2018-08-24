(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var ohHey = "Hello World";

var app = {};
window.app = app;
// Last.fm similar artist api url
app.apiKey = 'a57e83c492bc4a0ac36f18e47aaaf9b7';

app.artistMethods = {
    search: 'search',
    getInfo: 'getInfo',
    getSimilar: 'getSimilar',
    getTopTracks: 'getTopTracks',
    getTopAlbums: 'getTopAlbums',
    getTopTags: 'getTopTags'

    // Function to make api calls for artists
    // Param 1 - the type of call you want to make | Param 2 - the artist you're making the querying for
};app.artistQuery = function (method, artist, limit) {
    app.artistUrl = 'http://ws.audioscrobbler.com/2.0/?method=artist.' + method;
    return $.ajax({
        url: app.artistUrl,
        method: 'GET',
        dataType: 'json',
        data: {
            artist: artist,
            api_key: app.apiKey,
            limit: limit,
            format: 'json'
        }
    });
};

// 
// create a new array of similar artist names that we can pass as the "artist value for our other api calls
app.getSimilarArtists = function (artist) {
    app.artistQuery(app.artistMethods.getSimilar, artist).then(function (res) {
        var artist = res.similarartists.artist;
        var artistArr = artist.filter(function (artist) {
            return artist.match >= .25;
        }).map(function (artist) {
            return {
                name: artist.name,
                match: artist.match
            };
        });
        // get genre tags for the similar artists, add tags as property on artistsArr
        Promise.all([app.getSimilarArtistTags(artistArr),
        // get top albums for the similar artists 
        app.getSimilarArtistsTopAlbums(artistArr),
        // get top tracks for the similar artists, add tracks as property on artistsArr
        app.getSimilarArtistsTopTracks(artistArr)]).then(function () {

            app.createArtistCard(artistArr);

            $(".loadingOverlay").hide("fade", 500);
            // console.log(artistArr)
        });
    });
};

app.getSimilarArtistTags = function (array) {
    return new Promise(function (res) {
        array = array.map(function (item) {
            return app.artistQuery(app.artistMethods.getTopTags, item.name).then(function (res) {
                // create a variable for the tags array
                var tags = res.toptags.tag;

                // get the artist associated with each tags array
                var artist = app.getArtistFromRes(res.toptags);

                // filter the tags to those who are a match >= 10, then strip them to the essential info using map
                var tagArr = tags.filter(function (tag) {
                    return tag.count >= 20 && tag.name !== "seen live";
                }).map(function (tag) {
                    return {
                        name: tag.name,
                        relevancy: tag.count
                    };
                });

                // if the tag artist matches the initial array item's artist, add the tags as a property of that item
                if (artist === item.name) {
                    item.tags = tagArr;
                }
            });
        });
        Promise.all(array).then(res);
    });
};
// take an array of all the similar artists
// iterate over each artist and submit an api request using $.when for .getTopTracks
app.getSimilarArtistsTopTracks = function (array) {
    return new Promise(function (res) {
        array = array.map(function (item) {
            return app.artistQuery(app.artistMethods.getTopTracks, item.name, 10).then(function (res) {
                // console.log(res.toptracks);
                // create a variable for the tracks array
                var tracks = res.toptracks.track;

                // get the artist associated with each tracks array
                var artist = app.getArtistFromRes(res.toptracks);

                // Map the array of tracks returned by the api to contain only the properties we want
                var tracksArr = tracks.map(function (song) {

                    return {
                        name: song.name,
                        listeners: song.listeners,
                        playcount: song.playcount,
                        // dig through the the array of image objects to return only the url of the extralarge sized images
                        img: song.image.filter(function (img) {
                            return img.size === "extralarge";
                        }).map(function (img) {
                            return img["#text"];
                        }).toString()
                    };
                });

                // if the track artist matches the initial array item's artist, add tracks as a property of that item
                if (artist === item.name) {
                    item.tracks = tracksArr;
                }
            });
        });
        Promise.all(array).then(res);
    });
};

app.getSimilarArtistsTopAlbums = function (array) {
    return new Promise(function (res) {
        array = array.map(function (item) {
            return app.artistQuery(app.artistMethods.getTopAlbums, item.name, 5).then(function (res) {
                var artist = app.getArtistFromRes(res.topalbums);
                // console.log(artist);
                var albums = res.topalbums.album;
                // Map the array of albums returned by the API to display only the content we want
                var albumArr = albums.map(function (album) {
                    return {
                        name: album.name,
                        playcount: album.playcount,
                        image: album.image.filter(function (img) {
                            return img.size === "extralarge";
                        }).map(function (img) {
                            return img["#text"];
                        }).toString()

                    };
                });
                // Map if album artist matches the initial array items artist
                // Add the album array as a property of that item

                if (artist === item.name) {
                    item.albums = albumArr;
                }

                // console.log("artist", artist, "Item:", item.name)
            });
        });
        Promise.all(array).then(res);
    });
};

app.getArtistFromRes = function (rootObject) {
    return rootObject['@attr'].artist;
};

app.createArtistCard = function (array) {
    $('.artistCardContainer').empty();
    array.forEach(function (artist) {
        // console.log(Math.floor(Number(artist.match).toFixed(2) * 100).toString());

        var artistCard = $("<section>").addClass('artistCard');
        var percentMatch = Math.floor(Number(artist.match).toFixed(2) * 100);
        $('.artistCardContainer').append(artistCard);

        $(artistCard).append('\n        <div class="artistCard artistCard__banner" data-artist="' + artist.name + '">\n            <div class="artistCard__name">\n                <h3>' + artist.name + '</h3>\n            </div>\n            <div class="artistCard artistCard__match">\n                <div class="artistCard__match artistCard__match--outerBar">\n                    <div class="artistCard__match artistCard__match--innerBar" data-percentMatch="' + percentMatch + '">' + percentMatch + '%</div>\n\t\t\t\t</div>\n\t\t\t</div>\n        </div>\n        <div class="artistCard artistCard__expand">\n            <div class="artistCard artistCard__tags">\n                <ul></ul>\n            </div>\n            <div class="artistCard artistCard__tracks">\n                <ul></ul>\n            </div>\n            <div class="artistCard artistCard__albums">\n                <ul></ul>\n            </div>\n        </div>\n        ');
    });
    // add tags to dom
    app.addPropsToDom(array, "tags");

    // add tracks to dom
    app.addPropsToDom(array, "tracks");

    // add albums to dom
    app.addPropsToDom(array, "albums");

    // make the match percent meter reflect the match value
    app.percentMatch();
};

// Function to add property to DOM
app.addPropsToDom = function (array, prop) {
    // for each artist card banner...we do the following:
    $(".artistCard__banner").each(function () {
        var _this = this;

        //  iterate through every artist in our similar artists array
        array.forEach(function (artist) {
            // save the div's artist data tag
            var artistData = $(_this).data('artist');
            // if the artist data tag that we are currenty iterating though matches the similar artist's name that we're iterating through find the ul it belongs to and append its name as an li
            if (artist.name === artistData) {
                artist[prop].forEach(function (item) {
                    if (item.playcount !== undefined) {
                        $(_this).parent().find('.artistCard__' + prop + ' ul').append('<li>\n                            <h4>' + item.name + '</h4>\n                            <h4>Times played: ' + item.playcount + '</h4>\n                        </li>');
                    } else {
                        $(_this).parent().find('.artistCard__' + prop + ' ul').append('<li>\n                            <h4>' + item.name + '</h4>\n                        </li>');
                    }
                });
            }
        });
    });
    $(".artistCard__expand").hide(500);
};

// A function to make the "match meter" match it's width % to it's data('percentmatch') value
app.percentMatch = function () {
    $('.artistCard__match--innerBar').each(function () {
        // console.log($(this));
        var percentMatch = $(this).data('percentmatch');
        $(this).width('0px');
        $(this).animate({ width: percentMatch + '%' }, 1500, 'swing');
    });
};

app.events = function () {
    // e events here. form submits, clicks etc...
    $('.searchForm').on('submit', function (e) {
        e.preventDefault();
        app.searchArtist = $(this).find('.searchForm__input').val();
        app.getSimilarArtists(app.searchArtist);
        $(".loadingOverlay").show("fade", 500);
        // console.log(app.searchArtist);
    });

    $('.artistCardContainer').on('click', '.artistCard__banner', function () {
        console.log('ARTIST CARD BANNER CLICKED');
        var artist = $(this).data('artist');
        $(this).parent().find(".artistCard__expand").toggle("slide", { direction: "up" }, 500);
        // console.log(artist)
    });
};

// Initialize app
app.init = function () {
    app.events();

    $(".loadingOverlay").hide("fade", 500);
};
// Function ready
$(app.init);

// DYNAMIC MATCH SCALE - for similar artists end point, there is a match score reletive to the searched artists 0-1

// on user input - getSimilar

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsYUFBZDs7QUFFQSxJQUFNLE1BQU0sRUFBWjtBQUNBLE9BQU8sR0FBUCxHQUFhLEdBQWI7QUFDQTtBQUNBLElBQUksTUFBSjs7QUFFQSxJQUFJLGFBQUosR0FBb0I7QUFDaEIsWUFBUSxRQURRO0FBRWhCLGFBQVMsU0FGTztBQUdoQixnQkFBWSxZQUhJO0FBSWhCLGtCQUFjLGNBSkU7QUFLaEIsa0JBQWMsY0FMRTtBQU1oQixnQkFBWTs7QUFHaEI7QUFDQTtBQVZvQixDQUFwQixDQVdBLElBQUksV0FBSixHQUFrQixVQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLEtBQWpCLEVBQTJCO0FBQ3pDLFFBQUksU0FBSix3REFBbUUsTUFBbkU7QUFDQSxXQUFPLEVBQUUsSUFBRixDQUFPO0FBQ1YsYUFBSyxJQUFJLFNBREM7QUFFVixnQkFBUSxLQUZFO0FBR1Ysa0JBQVUsTUFIQTtBQUlWLGNBQU07QUFDRiwwQkFERTtBQUVGLHFCQUFTLElBQUksTUFGWDtBQUdGLHdCQUhFO0FBSUYsb0JBQVE7QUFKTjtBQUpJLEtBQVAsQ0FBUDtBQVdILENBYkQ7O0FBZUE7QUFDQTtBQUNBLElBQUksaUJBQUosR0FBd0IsVUFBQyxNQUFELEVBQVk7QUFDaEMsUUFBSSxXQUFKLENBQWdCLElBQUksYUFBSixDQUFrQixVQUFsQyxFQUE4QyxNQUE5QyxFQUNLLElBREwsQ0FDVSxVQUFDLEdBQUQsRUFBUztBQUNYLFlBQU0sU0FBUyxJQUFJLGNBQUosQ0FBbUIsTUFBbEM7QUFDQSxZQUFJLFlBQVksT0FDWCxNQURXLENBQ0osVUFBQyxNQUFEO0FBQUEsbUJBQVksT0FBTyxLQUFQLElBQWdCLEdBQTVCO0FBQUEsU0FESSxFQUVYLEdBRlcsQ0FFUCxVQUFDLE1BQUQsRUFBWTtBQUNiLG1CQUFPO0FB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Q0gsS0FORDs7QUFRQSxNQUFFLHNCQUFGLEVBQTBCLEVBQTFCLENBQTZCLE9BQTdCLEVBQXNDLHFCQUF0QyxFQUE2RCxZQUFVO0FBQ25FLGdCQUFRLEdBQVIsQ0FBWSw0QkFBWjtBQUNBLFlBQU0sU0FBUyxFQUFFLElBQUYsRUFBUSxJQUFSLENBQWEsUUFBYixDQUFmO0FBQ0EsVUFBRSxJQUFGLEVBQVEsTUFBUixHQUFpQixJQUFqQixDQUFzQixxQkFBdEIsRUFBNkMsTUFBN0MsQ0FBb0QsT0FBcEQsRUFBNkQsRUFBQyxXQUFXLElBQVosRUFBN0QsRUFBK0UsR0FBL0U7QUFDQTtBQUNILEtBTEQ7QUFNSCxDQWhCRDs7QUFtQkE7QUFDQSxJQUFJLElBQUosR0FBVyxZQUFNO0FBQ2IsUUFBSSxNQUFKOztBQUVBLE1BQUUsaUJBQUYsRUFBcUIsSUFBckIsQ0FBMEIsTUFBMUIsRUFBa0MsR0FBbEM7QUFFSCxDQUxEO0FBTUE7QUFDQSxFQUFFLElBQUksSUFBTjs7QUFHQTs7QUFFQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IG9oSGV5ID0gXCJIZWxsbyBXb3JsZFwiO1xuXG5jb25zdCBhcHAgPSB7fTtcbndpbmRvdy5hcHAgPSBhcHA7XG4vLyBMYXN0LmZtIHNpbWlsYXIgYXJ0aXN0IGFwaSB1cmxcbmFwcC5hcGlLZXkgPSBgYTU3ZTgzYzQ5MmJjNGEwYWMzNmYxOGU0N2FhYWY5YjdgXG5cbmFwcC5hcnRpc3RNZXRob2RzID0ge1xuICAgIHNlYXJjaDogJ3NlYXJjaCcsXG4gICAgZ2V0SW5mbzogJ2dldEluZm8nLFxuICAgIGdldFNpbWlsYXI6ICdnZXRTaW1pbGFyJyxcbiAgICBnZXRUb3BUcmFja3M6ICdnZXRUb3BUcmFja3MnLFxuICAgIGdldFRvcEFsYnVtczogJ2dldFRvcEFsYnVtcycsXG4gICAgZ2V0VG9wVGFnczogJ2dldFRvcFRhZ3MnLFxufVxuXG4vLyBGdW5jdGlvbiB0byBtYWtlIGFwaSBjYWxscyBmb3IgYXJ0aXN0c1xuLy8gUGFyYW0gMSAtIHRoZSB0eXBlIG9mIGNhbGwgeW91IHdhbnQgdG8gbWFrZSB8IFBhcmFtIDIgLSB0aGUgYXJ0aXN0IHlvdSdyZSBtYWtpbmcgdGhlIHF1ZXJ5aW5nIGZvclxuYXBwLmFydGlzdFF1ZXJ5ID0gKG1ldGhvZCwgYXJ0aXN0LCBsaW1pdCkgPT4ge1xuICAgIGFwcC5hcnRpc3RVcmwgPSBgaHR0cDovL3dzLmF1ZGlvc2Nyb2JibGVyLmNvbS8yLjAvP21ldGhvZD1hcnRpc3QuJHttZXRob2R9YFxuICAgIHJldHVybiAkLmFqYXgoe1xuICAgICAgICB1cmw6IGFwcC5hcnRpc3RVcmwsXG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGFydGlzdCxcbiAgICAgICAgICAgIGFwaV9rZXk6IGFwcC5hcGlLZXksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIGZvcm1hdDogJ2pzb24nLFxuICAgICAgICB9XG4gICAgfSlcbn07XG5cbi8vIFxuLy8gY3JlYXRlIGEgbmV3IGFycmF5IG9mIHNpbWlsYXIgYXJ0aXN0IG5hbWVzIHRoYXQgd2UgY2FuIHBhc3MgYXMgdGhlIFwiYXJ0aXN0IHZhbHVlIGZvciBvdXIgb3RoZXIgYXBpIGNhbGxzXG5hcHAuZ2V0U2ltaWxhckFydGlzdHMgPSAoYXJ0aXN0KSA9PiB7XG4gICAgYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFNpbWlsYXIsIGFydGlzdClcbiAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXJ0aXN0ID0gcmVzLnNpbWlsYXJhcnRpc3RzLmFydGlzdDtcbiAgICAgICAgICAgIGxldCBhcnRpc3RBcnIgPSBhcnRpc3RcbiAgICAgICAgICAgICAgICAuZmlsdGVyKChhcnRpc3QpID0+IGFydGlzdC5tYXRjaCA+PSAuMjUpXG4gICAgICAgICAgICAgICAgLm1hcCgoYXJ0aXN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBhcnRpc3QubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoOiBhcnRpc3QubWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGdldCBnZW5yZSB0YWdzIGZvciB0aGUgc2ltaWxhciBhcnRpc3RzLCBhZGQgdGFncyBhcyBwcm9wZXJ0eSBvbiBhcnRpc3RzQXJyXG4gICAgICAgICAgICBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RUYWdzKGFydGlzdEFyciksXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRvcCBhbGJ1bXMgZm9yIHRoZSBzaW1pbGFyIGFydGlzdHMgXG4gICAgICAgICAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RzVG9wQWxidW1zKGFydGlzdEFyciksXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRvcCB0cmFja3MgZm9yIHRoZSBzaW1pbGFyIGFydGlzdHMsIGFkZCB0cmFja3MgYXMgcHJvcGVydHkgb24gYXJ0aXN0c0FyclxuICAgICAgICAgICAgICAgIGFwcC5nZXRTaW1pbGFyQXJ0aXN0c1RvcFRyYWNrcyhhcnRpc3RBcnIpXSlcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgYXBwLmNyZWF0ZUFydGlzdENhcmQoYXJ0aXN0QXJyKVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgJChcIi5sb2FkaW5nT3ZlcmxheVwiKS5oaWRlKFwiZmFkZVwiLCA1MDApXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGFydGlzdEFycilcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbn1cblxuYXBwLmdldFNpbWlsYXJBcnRpc3RUYWdzID0gKGFycmF5KSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMpID0+IHtcbiAgICAgICAgYXJyYXkgPSBhcnJheS5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhcHAuYXJ0aXN0UXVlcnkoYXBwLmFydGlzdE1ldGhvZHMuZ2V0VG9wVGFncywgaXRlbS5uYW1lKVxuICAgICAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIGEgdmFyaWFibGUgZm9yIHRoZSB0YWdzIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSByZXMudG9wdGFncy50YWdcblxuICAgICAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIGFydGlzdCBhc3NvY2lhdGVkIHdpdGggZWFjaCB0YWdzIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFydGlzdCA9IGFwcC5nZXRBcnRpc3RGcm9tUmVzKHJlcy50b3B0YWdzKVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGZpbHRlciB0aGUgdGFncyB0byB0aG9zZSB3aG8gYXJlIGEgbWF0Y2ggPj0gMTAsIHRoZW4gc3RyaXAgdGhlbSB0byB0aGUgZXNzZW50aWFsIGluZm8gdXNpbmcgbWFwXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhZ0FyciA9IHRhZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKHRhZykgPT4gdGFnLmNvdW50ID49IDIwICYmIHRhZy5uYW1lICE9PSBcInNlZW4gbGl2ZVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgodGFnKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGFnLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGV2YW5jeTogdGFnLmNvdW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgdGFnIGFydGlzdCBtYXRjaGVzIHRoZSBpbml0aWFsIGFycmF5IGl0ZW0ncyBhcnRpc3QsIGFkZCB0aGUgdGFncyBhcyBhIHByb3BlcnR5IG9mIHRoYXQgaXRlbVxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJ0aXN0ID09PSBpdGVtLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udGFncyA9IHRhZ0FyclxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgUHJvbWlzZS5hbGwoYXJyYXkpXG4gICAgICAgICAgICAudGhlbihyZXMpO1xuICAgIH0pO1xufVxuLy8gdGFrZSBhbiBhcnJheSBvZiBhbGwgdGhlIHNpbWlsYXIgYXJ0aXN0c1xuLy8gaXRlcmF0ZSBvdmVyIGVhY2ggYXJ0aXN0IGFuZCBzdWJtaXQgYW4gYXBpIHJlcXVlc3QgdXNpbmcgJC53aGVuIGZvciAuZ2V0VG9wVHJhY2tzXG5hcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BUcmFja3MgPSAoYXJyYXkpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcykgPT4ge1xuICAgICAgICBhcnJheSA9IGFycmF5Lm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRUb3BUcmFja3MsIGl0ZW0ubmFtZSwgMTApXG4gICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocmVzLnRvcHRyYWNrcyk7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGEgdmFyaWFibGUgZm9yIHRoZSB0cmFja3MgYXJyYXlcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3MgPSByZXMudG9wdHJhY2tzLnRyYWNrXG4gICAgXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBhcnRpc3QgYXNzb2NpYXRlZCB3aXRoIGVhY2ggdHJhY2tzIGFycmF5XG4gICAgICAgICAgICAgICAgY29uc3QgYXJ0aXN0ID0gYXBwLmdldEFydGlzdEZyb21SZXMocmVzLnRvcHRyYWNrcylcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBNYXAgdGhlIGFycmF5IG9mIHRyYWNrcyByZXR1cm5lZCBieSB0aGUgYXBpIHRvIGNvbnRhaW4gb25seSB0aGUgcHJvcGVydGllcyB3ZSB3YW50XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2tzQXJyID0gdHJhY2tzXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKHNvbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzb25nLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzOiBzb25nLmxpc3RlbmVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGF5Y291bnQ6IHNvbmcucGxheWNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRpZyB0aHJvdWdoIHRoZSB0aGUgYXJyYXkgb2YgaW1hZ2Ugb2JqZWN0cyB0byByZXR1cm4gb25seSB0aGUgdXJsIG9mIHRoZSBleHRyYWxhcmdlIHNpemVkIGltYWdlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZzogc29uZy5pbWFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigoaW1nKSA9PiBpbWcuc2l6ZSA9PT0gXCJleHRyYWxhcmdlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKChpbWcpID0+IGltZ1tcIiN0ZXh0XCJdKS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGUgdHJhY2sgYXJ0aXN0IG1hdGNoZXMgdGhlIGluaXRpYWwgYXJyYXkgaXRlbSdzIGFydGlzdCwgYWRkIHRyYWNrcyBhcyBhIHByb3BlcnR5IG9mIHRoYXQgaXRlbVxuICAgICAgICAgICAgICAgIGlmIChhcnRpc3QgPT09IGl0ZW0ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnRyYWNrcyA9IHRyYWNrc0FyclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgUHJvbWlzZS5hbGwoYXJyYXkpXG4gICAgICAgICAgICAudGhlbihyZXMpO1xuICAgIH0pO1xufVxuXG5hcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BBbGJ1bXMgPSAoYXJyYXkpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcykgPT4ge1xuICAgICAgICBhcnJheSA9IGFycmF5Lm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRUb3BBbGJ1bXMsIGl0ZW0ubmFtZSwgNSlcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhcnRpc3QgPSBhcHAuZ2V0QXJ0aXN0RnJvbVJlcyhyZXMudG9wYWxidW1zKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhcnRpc3QpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsYnVtcyA9IHJlcy50b3BhbGJ1bXMuYWxidW1cbiAgICAgICAgICAgICAgICAvLyBNYXAgdGhlIGFycmF5IG9mIGFsYnVtcyByZXR1cm5lZCBieSB0aGUgQVBJIHRvIGRpc3BsYXkgb25seSB0aGUgY29udGVudCB3ZSB3YW50XG4gICAgICAgICAgICAgICAgY29uc3QgYWxidW1BcnIgPSBhbGJ1bXMuXG4gICAgICAgICAgICAgICAgbWFwKChhbGJ1bSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm57XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBhbGJ1bS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxheWNvdW50OiBhbGJ1bS5wbGF5Y291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZTogYWxidW0uaW1hZ2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIoKGltZykgPT4gaW1nLnNpemUgPT09IFwiZXh0cmFsYXJnZVwiKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcCgoaW1nKSA9PiBpbWdbXCIjdGV4dFwiXSkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gTWFwIGlmIGFsYnVtIGFydGlzdCBtYXRjaGVzIHRoZSBpbml0aWFsIGFycmF5IGl0ZW1zIGFydGlzdFxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgYWxidW0gYXJyYXkgYXMgYSBwcm9wZXJ0eSBvZiB0aGF0IGl0ZW1cbiAgICBcbiAgICAgICAgICAgICAgICBpZihhcnRpc3QgPT09IGl0ZW0ubmFtZSl7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uYWxidW1zID0gYWxidW1BcnI7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiYXJ0aXN0XCIsIGFydGlzdCwgXCJJdGVtOlwiLCBpdGVtLm5hbWUpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICBQcm9taXNlLmFsbChhcnJheSlcbiAgICAgICAgICAgIC50aGVuKHJlcyk7XG4gICAgfSk7XG59XG5cbmFwcC5nZXRBcnRpc3RGcm9tUmVzID0gKHJvb3RPYmplY3QpID0+IHtcbiAgICByZXR1cm4gcm9vdE9iamVjdFsnQGF0dHInXS5hcnRpc3Rcbn07XG5cbmFwcC5jcmVhdGVBcnRpc3RDYXJkID0gKGFycmF5KSA9PiB7XG4gICAgJCgnLmFydGlzdENhcmRDb250YWluZXInKS5lbXB0eSgpXG4gICAgYXJyYXkuZm9yRWFjaCgoYXJ0aXN0KSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKE1hdGguZmxvb3IoTnVtYmVyKGFydGlzdC5tYXRjaCkudG9GaXhlZCgyKSAqIDEwMCkudG9TdHJpbmcoKSk7XG5cbiAgICAgICAgY29uc3QgYXJ0aXN0Q2FyZCA9ICQoXCI8c2VjdGlvbj5cIikuYWRkQ2xhc3MoJ2FydGlzdENhcmQnKVxuICAgICAgICBjb25zdCBwZXJjZW50TWF0Y2ggPSBNYXRoLmZsb29yKE51bWJlcihhcnRpc3QubWF0Y2gpLnRvRml4ZWQoMikgKiAxMDApXG4gICAgICAgICQoJy5hcnRpc3RDYXJkQ29udGFpbmVyJykuYXBwZW5kKGFydGlzdENhcmQpXG5cbiAgICAgICAgJChhcnRpc3RDYXJkKS5hcHBlbmQoYFxuICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX19iYW5uZXJcIiBkYXRhLWFydGlzdD1cIiR7YXJ0aXN0Lm5hbWV9XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fbmFtZVwiPlxuICAgICAgICAgICAgICAgIDxoMz4ke2FydGlzdC5uYW1lfTwvaDM+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX21hdGNoXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmRfX21hdGNoIGFydGlzdENhcmRfX21hdGNoLS1vdXRlckJhclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fbWF0Y2ggYXJ0aXN0Q2FyZF9fbWF0Y2gtLWlubmVyQmFyXCIgZGF0YS1wZXJjZW50TWF0Y2g9XCIke3BlcmNlbnRNYXRjaH1cIj4ke3BlcmNlbnRNYXRjaH0lPC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX19leHBhbmRcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX3RhZ3NcIj5cbiAgICAgICAgICAgICAgICA8dWw+PC91bD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmQgYXJ0aXN0Q2FyZF9fdHJhY2tzXCI+XG4gICAgICAgICAgICAgICAgPHVsPjwvdWw+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX2FsYnVtc1wiPlxuICAgICAgICAgICAgICAgIDx1bD48L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBgKVxuICAgIH0pO1xuICAgIC8vIGFkZCB0YWdzIHRvIGRvbVxuICAgIGFwcC5hZGRQcm9wc1RvRG9tKGFycmF5LCBcInRhZ3NcIilcblxuICAgIC8vIGFkZCB0cmFja3MgdG8gZG9tXG4gICAgYXBwLmFkZFByb3BzVG9Eb20oYXJyYXksIFwidHJhY2tzXCIpXG5cbiAgICAvLyBhZGQgYWxidW1zIHRvIGRvbVxuICAgIGFwcC5hZGRQcm9wc1RvRG9tKGFycmF5LCBcImFsYnVtc1wiKVxuXG4gICAgLy8gbWFrZSB0aGUgbWF0Y2ggcGVyY2VudCBtZXRlciByZWZsZWN0IHRoZSBtYXRjaCB2YWx1ZVxuICAgIGFwcC5wZXJjZW50TWF0Y2goKVxuXG59XG5cbi8vIEZ1bmN0aW9uIHRvIGFkZCBwcm9wZXJ0eSB0byBET01cbmFwcC5hZGRQcm9wc1RvRG9tID0gKGFycmF5LCBwcm9wKSA9PiB7XG4gICAgLy8gZm9yIGVhY2ggYXJ0aXN0IGNhcmQgYmFubmVyLi4ud2UgZG8gdGhlIGZvbGxvd2luZzpcbiAgICAkKFwiLmFydGlzdENhcmRfX2Jhbm5lclwiKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vICBpdGVyYXRlIHRocm91Z2ggZXZlcnkgYXJ0aXN0IGluIG91ciBzaW1pbGFyIGFydGlzdHMgYXJyYXlcbiAgICAgICAgYXJyYXkuZm9yRWFjaCgoYXJ0aXN0KSA9PiB7XG4gICAgICAgICAgICAvLyBzYXZlIHRoZSBkaXYncyBhcnRpc3QgZGF0YSB0YWdcbiAgICAgICAgICAgIGNvbnN0IGFydGlzdERhdGEgPSAkKHRoaXMpLmRhdGEoJ2FydGlzdCcpXG4gICAgICAgICAgICAvLyBpZiB0aGUgYXJ0aXN0IGRhdGEgdGFnIHRoYXQgd2UgYXJlIGN1cnJlbnR5IGl0ZXJhdGluZyB0aG91Z2ggbWF0Y2hlcyB0aGUgc2ltaWxhciBhcnRpc3QncyBuYW1lIHRoYXQgd2UncmUgaXRlcmF0aW5nIHRocm91Z2ggZmluZCB0aGUgdWwgaXQgYmVsb25ncyB0byBhbmQgYXBwZW5kIGl0cyBuYW1lIGFzIGFuIGxpXG4gICAgICAgICAgICBpZiAoYXJ0aXN0Lm5hbWUgPT09IGFydGlzdERhdGEpIHtcbiAgICAgICAgICAgICAgICBhcnRpc3RbcHJvcF0uZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZihpdGVtLnBsYXljb3VudCAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkuZmluZChgLmFydGlzdENhcmRfXyR7cHJvcH0gdWxgKS5hcHBlbmQoYDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+JHtpdGVtLm5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+VGltZXMgcGxheWVkOiAke2l0ZW0ucGxheWNvdW50fTwvaDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2xpPmApXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkuZmluZChgLmFydGlzdENhcmRfXyR7cHJvcH0gdWxgKS5hcHBlbmQoYDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+JHtpdGVtLm5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+YClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxuICAgICQoXCIuYXJ0aXN0Q2FyZF9fZXhwYW5kXCIpLmhpZGUoNTAwKVxufVxuXG4vLyBBIGZ1bmN0aW9uIHRvIG1ha2UgdGhlIFwibWF0Y2ggbWV0ZXJcIiBtYXRjaCBpdCdzIHdpZHRoICUgdG8gaXQncyBkYXRhKCdwZXJjZW50bWF0Y2gnKSB2YWx1ZVxuYXBwLnBlcmNlbnRNYXRjaCA9ICgpID0+IHtcbiAgICAkKCcuYXJ0aXN0Q2FyZF9fbWF0Y2gtLWlubmVyQmFyJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCQodGhpcykpO1xuICAgICAgICBjb25zdCBwZXJjZW50TWF0Y2ggPSAkKHRoaXMpLmRhdGEoJ3BlcmNlbnRtYXRjaCcpXG4gICAgICAgICQodGhpcykud2lkdGgoYDBweGApXG4gICAgICAgICQodGhpcykuYW5pbWF0ZSh7IHdpZHRoOiBgJHtwZXJjZW50TWF0Y2h9JWAgfSwgMTUwMCwgJ3N3aW5nJylcblxuICAgIH0pO1xuICAgIFxufTtcblxuYXBwLmV2ZW50cyA9ICgpID0+IHtcbiAgICAvLyBlIGV2ZW50cyBoZXJlLiBmb3JtIHN1Ym1pdHMsIGNsaWNrcyBldGMuLi5cbiAgICAkKCcuc2VhcmNoRm9ybScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBhcHAuc2VhcmNoQXJ0aXN0ID0gJCh0aGlzKS5maW5kKCcuc2VhcmNoRm9ybV9faW5wdXQnKS52YWwoKTtcbiAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RzKGFwcC5zZWFyY2hBcnRpc3QpO1xuICAgICAgICAkKFwiLmxvYWRpbmdPdmVybGF5XCIpLnNob3coXCJmYWRlXCIsIDUwMClcbiAgICAgICAgLy8gY29uc29sZS5sb2coYXBwLnNlYXJjaEFydGlzdCk7XG4gICAgfSlcblxuICAgICQoJy5hcnRpc3RDYXJkQ29udGFpbmVyJykub24oJ2NsaWNrJywgJy5hcnRpc3RDYXJkX19iYW5uZXInLCBmdW5jdGlvbigpe1xuICAgICAgICBjb25zb2xlLmxvZygnQVJUSVNUIENBUkQgQkFOTkVSIENMSUNLRUQnKVxuICAgICAgICBjb25zdCBhcnRpc3QgPSAkKHRoaXMpLmRhdGEoJ2FydGlzdCcpXG4gICAgICAgICQodGhpcykucGFyZW50KCkuZmluZChcIi5hcnRpc3RDYXJkX19leHBhbmRcIikudG9nZ2xlKFwic2xpZGVcIiwge2RpcmVjdGlvbjogXCJ1cFwifSw1MDApXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGFydGlzdClcbiAgICB9KTtcbn07XG5cblxuLy8gSW5pdGlhbGl6ZSBhcHBcbmFwcC5pbml0ID0gKCkgPT4ge1xuICAgIGFwcC5ldmVudHMoKVxuXG4gICAgJChcIi5sb2FkaW5nT3ZlcmxheVwiKS5oaWRlKFwiZmFkZVwiLCA1MDApXG5cbn1cbi8vIEZ1bmN0aW9uIHJlYWR5XG4kKGFwcC5pbml0KVxuXG5cbi8vIERZTkFNSUMgTUFUQ0ggU0NBTEUgLSBmb3Igc2ltaWxhciBhcnRpc3RzIGVuZCBwb2ludCwgdGhlcmUgaXMgYSBtYXRjaCBzY29yZSByZWxldGl2ZSB0byB0aGUgc2VhcmNoZWQgYXJ0aXN0cyAwLTFcblxuLy8gb24gdXNlciBpbnB1dCAtIGdldFNpbWlsYXIiXX0=
