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
                        $(_this).parent().find('.artistCard__' + prop + ' ul').append('<li>' + item.name + '<span>' + item.playcount + '</span></li>');
                    } else {
                        $(_this).parent().find('.artistCard__' + prop + ' ul').append('<li>' + item.name + '</li>');
                    }
                });
            }
        });
    });
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
        // console.log(app.searchArtist);
    });

    $('.artistCardContainer').on('click', '.artistCard__banner', function () {
        console.log('ARTIST CARD BANNER CLICKED');
        var artist = $(this).data('artist');
        console.log(artist);
    });
};

// Initialize app
app.init = function () {
    app.events();
};
// Function ready
$(app.init);

// DYNAMIC MATCH SCALE - for similar artists end point, there is a match score reletive to the searched artists 0-1

// on user input - getSimilar

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsYUFBZDs7QUFFQSxJQUFNLE1BQU0sRUFBWjtBQUNBLE9BQU8sR0FBUCxHQUFhLEdBQWI7QUFDQTtBQUNBLElBQUksTUFBSjs7QUFFQSxJQUFJLGFBQUosR0FBb0I7QUFDaEIsWUFBUSxRQURRO0FBRWhCLGFBQVMsU0FGTztBQUdoQixnQkFBWSxZQUhJO0FBSWhCLGtCQUFjLGNBSkU7QUFLaEIsa0JBQWMsY0FMRTtBQU1oQixnQkFBWTs7QUFHaEI7QUFDQTtBQVZvQixDQUFwQixDQVdBLElBQUksV0FBSixHQUFrQixVQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLEtBQWpCLEVBQTJCO0FBQ3pDLFFBQUksU0FBSix3REFBbUUsTUFBbkU7QUFDQSxXQUFPLEVBQUUsSUFBRixDQUFPO0FBQ1YsYUFBSyxJQUFJLFNBREM7QUFFVixnQkFBUSxLQUZFO0FBR1Ysa0JBQVUsTUFIQTtBQUlWLGNBQU07QUFDRiwwQkFERTtBQUVGLHFCQUFTLElBQUksTUFGWDtBQUdGLHdCQUhFO0FBSUYsb0JBQVE7QUFKTjtBQUpJLEtBQVAsQ0FBUDtBQVdILENBYkQ7O0FBZUE7QUFDQTtBQUNBLElBQUksaUJBQUosR0FBd0IsVUFBQyxNQUFELEVBQVk7QUFDaEMsUUFBSSxXQUFKLENBQWdCLElBQUksYUFBSixDQUFrQixVQUFsQyxFQUE4QyxNQUE5QyxFQUNLLElBREwsQ0FDVSxVQUFDLEdBQUQsRUFBUztBQUNYLFlBQU0sU0FBUyxJQUFJLGNBQUosQ0FBbUIsTUFBbEM7QUFDQSxZQUFJLFlBQVksT0FDWCxNQURXLENBQ0osVUFBQyxNQUFEO0FBQUEsbUJBQVksT0FBTyxLQUFQLElBQWdCLEdBQTVCO0FBQUEsU0FESSxFQUVYLEdBRlcsQ0FFUCxVQUFDLE1BQUQsRUFBWTtBQUNiLG1CQUFPO0FB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Q0FBZjtBQUNBLGdCQUFRLEdBQVIsQ0FBWSxNQUFaO0FBQ0gsS0FKRDtBQUtILENBZEQ7O0FBaUJBO0FBQ0EsSUFBSSxJQUFKLEdBQVcsWUFBTTtBQUNiLFFBQUksTUFBSjtBQUNILENBRkQ7QUFHQTtBQUNBLEVBQUUsSUFBSSxJQUFOOztBQUdBOztBQUVBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3Qgb2hIZXkgPSBcIkhlbGxvIFdvcmxkXCI7XG5cbmNvbnN0IGFwcCA9IHt9O1xud2luZG93LmFwcCA9IGFwcDtcbi8vIExhc3QuZm0gc2ltaWxhciBhcnRpc3QgYXBpIHVybFxuYXBwLmFwaUtleSA9IGBhNTdlODNjNDkyYmM0YTBhYzM2ZjE4ZTQ3YWFhZjliN2BcblxuYXBwLmFydGlzdE1ldGhvZHMgPSB7XG4gICAgc2VhcmNoOiAnc2VhcmNoJyxcbiAgICBnZXRJbmZvOiAnZ2V0SW5mbycsXG4gICAgZ2V0U2ltaWxhcjogJ2dldFNpbWlsYXInLFxuICAgIGdldFRvcFRyYWNrczogJ2dldFRvcFRyYWNrcycsXG4gICAgZ2V0VG9wQWxidW1zOiAnZ2V0VG9wQWxidW1zJyxcbiAgICBnZXRUb3BUYWdzOiAnZ2V0VG9wVGFncycsXG59XG5cbi8vIEZ1bmN0aW9uIHRvIG1ha2UgYXBpIGNhbGxzIGZvciBhcnRpc3RzXG4vLyBQYXJhbSAxIC0gdGhlIHR5cGUgb2YgY2FsbCB5b3Ugd2FudCB0byBtYWtlIHwgUGFyYW0gMiAtIHRoZSBhcnRpc3QgeW91J3JlIG1ha2luZyB0aGUgcXVlcnlpbmcgZm9yXG5hcHAuYXJ0aXN0UXVlcnkgPSAobWV0aG9kLCBhcnRpc3QsIGxpbWl0KSA9PiB7XG4gICAgYXBwLmFydGlzdFVybCA9IGBodHRwOi8vd3MuYXVkaW9zY3JvYmJsZXIuY29tLzIuMC8/bWV0aG9kPWFydGlzdC4ke21ldGhvZH1gXG4gICAgcmV0dXJuICQuYWpheCh7XG4gICAgICAgIHVybDogYXBwLmFydGlzdFVybCxcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXJ0aXN0LFxuICAgICAgICAgICAgYXBpX2tleTogYXBwLmFwaUtleSxcbiAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgZm9ybWF0OiAnanNvbicsXG4gICAgICAgIH1cbiAgICB9KVxufTtcblxuLy8gXG4vLyBjcmVhdGUgYSBuZXcgYXJyYXkgb2Ygc2ltaWxhciBhcnRpc3QgbmFtZXMgdGhhdCB3ZSBjYW4gcGFzcyBhcyB0aGUgXCJhcnRpc3QgdmFsdWUgZm9yIG91ciBvdGhlciBhcGkgY2FsbHNcbmFwcC5nZXRTaW1pbGFyQXJ0aXN0cyA9IChhcnRpc3QpID0+IHtcbiAgICBhcHAuYXJ0aXN0UXVlcnkoYXBwLmFydGlzdE1ldGhvZHMuZ2V0U2ltaWxhciwgYXJ0aXN0KVxuICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhcnRpc3QgPSByZXMuc2ltaWxhcmFydGlzdHMuYXJ0aXN0O1xuICAgICAgICAgICAgbGV0IGFydGlzdEFyciA9IGFydGlzdFxuICAgICAgICAgICAgICAgIC5maWx0ZXIoKGFydGlzdCkgPT4gYXJ0aXN0Lm1hdGNoID49IC4yNSlcbiAgICAgICAgICAgICAgICAubWFwKChhcnRpc3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFydGlzdC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IGFydGlzdC5tYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gZ2V0IGdlbnJlIHRhZ3MgZm9yIHRoZSBzaW1pbGFyIGFydGlzdHMsIGFkZCB0YWdzIGFzIHByb3BlcnR5IG9uIGFydGlzdHNBcnJcbiAgICAgICAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICBhcHAuZ2V0U2ltaWxhckFydGlzdFRhZ3MoYXJ0aXN0QXJyKSxcbiAgICAgICAgICAgICAgICAvLyBnZXQgdG9wIGFsYnVtcyBmb3IgdGhlIHNpbWlsYXIgYXJ0aXN0cyBcbiAgICAgICAgICAgICAgICBhcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BBbGJ1bXMoYXJ0aXN0QXJyKSxcbiAgICAgICAgICAgICAgICAvLyBnZXQgdG9wIHRyYWNrcyBmb3IgdGhlIHNpbWlsYXIgYXJ0aXN0cywgYWRkIHRyYWNrcyBhcyBwcm9wZXJ0eSBvbiBhcnRpc3RzQXJyXG4gICAgICAgICAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RzVG9wVHJhY2tzKGFydGlzdEFycildKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICBhcHAuY3JlYXRlQXJ0aXN0Q2FyZChhcnRpc3RBcnIpXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGFydGlzdEFycilcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbn1cblxuYXBwLmdldFNpbWlsYXJBcnRpc3RUYWdzID0gKGFycmF5KSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMpID0+IHtcbiAgICAgICAgYXJyYXkgPSBhcnJheS5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhcHAuYXJ0aXN0UXVlcnkoYXBwLmFydGlzdE1ldGhvZHMuZ2V0VG9wVGFncywgaXRlbS5uYW1lKVxuICAgICAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIGEgdmFyaWFibGUgZm9yIHRoZSB0YWdzIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSByZXMudG9wdGFncy50YWdcblxuICAgICAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIGFydGlzdCBhc3NvY2lhdGVkIHdpdGggZWFjaCB0YWdzIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFydGlzdCA9IGFwcC5nZXRBcnRpc3RGcm9tUmVzKHJlcy50b3B0YWdzKVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGZpbHRlciB0aGUgdGFncyB0byB0aG9zZSB3aG8gYXJlIGEgbWF0Y2ggPj0gMTAsIHRoZW4gc3RyaXAgdGhlbSB0byB0aGUgZXNzZW50aWFsIGluZm8gdXNpbmcgbWFwXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhZ0FyciA9IHRhZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKHRhZykgPT4gdGFnLmNvdW50ID49IDIwICYmIHRhZy5uYW1lICE9PSBcInNlZW4gbGl2ZVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgodGFnKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGFnLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGV2YW5jeTogdGFnLmNvdW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgdGFnIGFydGlzdCBtYXRjaGVzIHRoZSBpbml0aWFsIGFycmF5IGl0ZW0ncyBhcnRpc3QsIGFkZCB0aGUgdGFncyBhcyBhIHByb3BlcnR5IG9mIHRoYXQgaXRlbVxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJ0aXN0ID09PSBpdGVtLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udGFncyA9IHRhZ0FyclxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgUHJvbWlzZS5hbGwoYXJyYXkpXG4gICAgICAgICAgICAudGhlbihyZXMpO1xuICAgIH0pO1xufVxuLy8gdGFrZSBhbiBhcnJheSBvZiBhbGwgdGhlIHNpbWlsYXIgYXJ0aXN0c1xuLy8gaXRlcmF0ZSBvdmVyIGVhY2ggYXJ0aXN0IGFuZCBzdWJtaXQgYW4gYXBpIHJlcXVlc3QgdXNpbmcgJC53aGVuIGZvciAuZ2V0VG9wVHJhY2tzXG5hcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BUcmFja3MgPSAoYXJyYXkpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcykgPT4ge1xuICAgICAgICBhcnJheSA9IGFycmF5Lm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRUb3BUcmFja3MsIGl0ZW0ubmFtZSwgMTApXG4gICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocmVzLnRvcHRyYWNrcyk7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGEgdmFyaWFibGUgZm9yIHRoZSB0cmFja3MgYXJyYXlcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3MgPSByZXMudG9wdHJhY2tzLnRyYWNrXG4gICAgXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBhcnRpc3QgYXNzb2NpYXRlZCB3aXRoIGVhY2ggdHJhY2tzIGFycmF5XG4gICAgICAgICAgICAgICAgY29uc3QgYXJ0aXN0ID0gYXBwLmdldEFydGlzdEZyb21SZXMocmVzLnRvcHRyYWNrcylcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBNYXAgdGhlIGFycmF5IG9mIHRyYWNrcyByZXR1cm5lZCBieSB0aGUgYXBpIHRvIGNvbnRhaW4gb25seSB0aGUgcHJvcGVydGllcyB3ZSB3YW50XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2tzQXJyID0gdHJhY2tzXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKHNvbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzb25nLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzOiBzb25nLmxpc3RlbmVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGF5Y291bnQ6IHNvbmcucGxheWNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRpZyB0aHJvdWdoIHRoZSB0aGUgYXJyYXkgb2YgaW1hZ2Ugb2JqZWN0cyB0byByZXR1cm4gb25seSB0aGUgdXJsIG9mIHRoZSBleHRyYWxhcmdlIHNpemVkIGltYWdlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZzogc29uZy5pbWFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigoaW1nKSA9PiBpbWcuc2l6ZSA9PT0gXCJleHRyYWxhcmdlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKChpbWcpID0+IGltZ1tcIiN0ZXh0XCJdKS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGUgdHJhY2sgYXJ0aXN0IG1hdGNoZXMgdGhlIGluaXRpYWwgYXJyYXkgaXRlbSdzIGFydGlzdCwgYWRkIHRyYWNrcyBhcyBhIHByb3BlcnR5IG9mIHRoYXQgaXRlbVxuICAgICAgICAgICAgICAgIGlmIChhcnRpc3QgPT09IGl0ZW0ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnRyYWNrcyA9IHRyYWNrc0FyclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgUHJvbWlzZS5hbGwoYXJyYXkpXG4gICAgICAgICAgICAudGhlbihyZXMpO1xuICAgIH0pO1xufVxuXG5hcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BBbGJ1bXMgPSAoYXJyYXkpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcykgPT4ge1xuICAgICAgICBhcnJheSA9IGFycmF5Lm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRUb3BBbGJ1bXMsIGl0ZW0ubmFtZSwgNSlcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhcnRpc3QgPSBhcHAuZ2V0QXJ0aXN0RnJvbVJlcyhyZXMudG9wYWxidW1zKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhcnRpc3QpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsYnVtcyA9IHJlcy50b3BhbGJ1bXMuYWxidW1cbiAgICAgICAgICAgICAgICAvLyBNYXAgdGhlIGFycmF5IG9mIGFsYnVtcyByZXR1cm5lZCBieSB0aGUgQVBJIHRvIGRpc3BsYXkgb25seSB0aGUgY29udGVudCB3ZSB3YW50XG4gICAgICAgICAgICAgICAgY29uc3QgYWxidW1BcnIgPSBhbGJ1bXMuXG4gICAgICAgICAgICAgICAgbWFwKChhbGJ1bSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm57XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBhbGJ1bS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxheWNvdW50OiBhbGJ1bS5wbGF5Y291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZTogYWxidW0uaW1hZ2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIoKGltZykgPT4gaW1nLnNpemUgPT09IFwiZXh0cmFsYXJnZVwiKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcCgoaW1nKSA9PiBpbWdbXCIjdGV4dFwiXSkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gTWFwIGlmIGFsYnVtIGFydGlzdCBtYXRjaGVzIHRoZSBpbml0aWFsIGFycmF5IGl0ZW1zIGFydGlzdFxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgYWxidW0gYXJyYXkgYXMgYSBwcm9wZXJ0eSBvZiB0aGF0IGl0ZW1cbiAgICBcbiAgICAgICAgICAgICAgICBpZihhcnRpc3QgPT09IGl0ZW0ubmFtZSl7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uYWxidW1zID0gYWxidW1BcnI7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiYXJ0aXN0XCIsIGFydGlzdCwgXCJJdGVtOlwiLCBpdGVtLm5hbWUpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICBQcm9taXNlLmFsbChhcnJheSlcbiAgICAgICAgICAgIC50aGVuKHJlcyk7XG4gICAgfSk7XG59XG5cbmFwcC5nZXRBcnRpc3RGcm9tUmVzID0gKHJvb3RPYmplY3QpID0+IHtcbiAgICByZXR1cm4gcm9vdE9iamVjdFsnQGF0dHInXS5hcnRpc3Rcbn07XG5cbmFwcC5jcmVhdGVBcnRpc3RDYXJkID0gKGFycmF5KSA9PiB7XG4gICAgJCgnLmFydGlzdENhcmRDb250YWluZXInKS5lbXB0eSgpXG4gICAgYXJyYXkuZm9yRWFjaCgoYXJ0aXN0KSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKE1hdGguZmxvb3IoTnVtYmVyKGFydGlzdC5tYXRjaCkudG9GaXhlZCgyKSAqIDEwMCkudG9TdHJpbmcoKSk7XG5cbiAgICAgICAgY29uc3QgYXJ0aXN0Q2FyZCA9ICQoXCI8c2VjdGlvbj5cIikuYWRkQ2xhc3MoJ2FydGlzdENhcmQnKVxuICAgICAgICBjb25zdCBwZXJjZW50TWF0Y2ggPSBNYXRoLmZsb29yKE51bWJlcihhcnRpc3QubWF0Y2gpLnRvRml4ZWQoMikgKiAxMDApXG4gICAgICAgICQoJy5hcnRpc3RDYXJkQ29udGFpbmVyJykuYXBwZW5kKGFydGlzdENhcmQpXG5cbiAgICAgICAgJChhcnRpc3RDYXJkKS5hcHBlbmQoYFxuICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX19iYW5uZXJcIiBkYXRhLWFydGlzdD1cIiR7YXJ0aXN0Lm5hbWV9XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fbmFtZVwiPlxuICAgICAgICAgICAgICAgIDxoMz4ke2FydGlzdC5uYW1lfTwvaDM+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX21hdGNoXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmRfX21hdGNoIGFydGlzdENhcmRfX21hdGNoLS1vdXRlckJhclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fbWF0Y2ggYXJ0aXN0Q2FyZF9fbWF0Y2gtLWlubmVyQmFyXCIgZGF0YS1wZXJjZW50TWF0Y2g9XCIke3BlcmNlbnRNYXRjaH1cIj4ke3BlcmNlbnRNYXRjaH0lPC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX19leHBhbmRcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX3RhZ3NcIj5cbiAgICAgICAgICAgICAgICA8dWw+PC91bD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmQgYXJ0aXN0Q2FyZF9fdHJhY2tzXCI+XG4gICAgICAgICAgICAgICAgPHVsPjwvdWw+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX2FsYnVtc1wiPlxuICAgICAgICAgICAgICAgIDx1bD48L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBgKVxuICAgIH0pO1xuICAgIC8vIGFkZCB0YWdzIHRvIGRvbVxuICAgIGFwcC5hZGRQcm9wc1RvRG9tKGFycmF5LCBcInRhZ3NcIilcblxuICAgIC8vIGFkZCB0cmFja3MgdG8gZG9tXG4gICAgYXBwLmFkZFByb3BzVG9Eb20oYXJyYXksIFwidHJhY2tzXCIpXG5cbiAgICAvLyBhZGQgYWxidW1zIHRvIGRvbVxuICAgIGFwcC5hZGRQcm9wc1RvRG9tKGFycmF5LCBcImFsYnVtc1wiKVxuXG4gICAgLy8gbWFrZSB0aGUgbWF0Y2ggcGVyY2VudCBtZXRlciByZWZsZWN0IHRoZSBtYXRjaCB2YWx1ZVxuICAgIGFwcC5wZXJjZW50TWF0Y2goKVxufVxuXG4vLyBGdW5jdGlvbiB0byBhZGQgcHJvcGVydHkgdG8gRE9NXG5hcHAuYWRkUHJvcHNUb0RvbSA9IChhcnJheSwgcHJvcCkgPT4ge1xuICAgIC8vIGZvciBlYWNoIGFydGlzdCBjYXJkIGJhbm5lci4uLndlIGRvIHRoZSBmb2xsb3dpbmc6XG4gICAgJChcIi5hcnRpc3RDYXJkX19iYW5uZXJcIikuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAvLyAgaXRlcmF0ZSB0aHJvdWdoIGV2ZXJ5IGFydGlzdCBpbiBvdXIgc2ltaWxhciBhcnRpc3RzIGFycmF5XG4gICAgICAgIGFycmF5LmZvckVhY2goKGFydGlzdCkgPT4ge1xuICAgICAgICAgICAgLy8gc2F2ZSB0aGUgZGl2J3MgYXJ0aXN0IGRhdGEgdGFnXG4gICAgICAgICAgICBjb25zdCBhcnRpc3REYXRhID0gJCh0aGlzKS5kYXRhKCdhcnRpc3QnKVxuICAgICAgICAgICAgLy8gaWYgdGhlIGFydGlzdCBkYXRhIHRhZyB0aGF0IHdlIGFyZSBjdXJyZW50eSBpdGVyYXRpbmcgdGhvdWdoIG1hdGNoZXMgdGhlIHNpbWlsYXIgYXJ0aXN0J3MgbmFtZSB0aGF0IHdlJ3JlIGl0ZXJhdGluZyB0aHJvdWdoIGZpbmQgdGhlIHVsIGl0IGJlbG9uZ3MgdG8gYW5kIGFwcGVuZCBpdHMgbmFtZSBhcyBhbiBsaVxuICAgICAgICAgICAgaWYgKGFydGlzdC5uYW1lID09PSBhcnRpc3REYXRhKSB7XG4gICAgICAgICAgICAgICAgYXJ0aXN0W3Byb3BdLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYoaXRlbS5wbGF5Y291bnQgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLmZpbmQoYC5hcnRpc3RDYXJkX18ke3Byb3B9IHVsYCkuYXBwZW5kKGA8bGk+JHtpdGVtLm5hbWV9PHNwYW4+JHtpdGVtLnBsYXljb3VudH08L3NwYW4+PC9saT5gKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLmZpbmQoYC5hcnRpc3RDYXJkX18ke3Byb3B9IHVsYCkuYXBwZW5kKGA8bGk+JHtpdGVtLm5hbWV9PC9saT5gKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG59XG5cbi8vIEEgZnVuY3Rpb24gdG8gbWFrZSB0aGUgXCJtYXRjaCBtZXRlclwiIG1hdGNoIGl0J3Mgd2lkdGggJSB0byBpdCdzIGRhdGEoJ3BlcmNlbnRtYXRjaCcpIHZhbHVlXG5hcHAucGVyY2VudE1hdGNoID0gKCkgPT4ge1xuICAgICQoJy5hcnRpc3RDYXJkX19tYXRjaC0taW5uZXJCYXInKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJCh0aGlzKSk7XG4gICAgICAgIGNvbnN0IHBlcmNlbnRNYXRjaCA9ICQodGhpcykuZGF0YSgncGVyY2VudG1hdGNoJylcbiAgICAgICAgJCh0aGlzKS53aWR0aChgMHB4YClcbiAgICAgICAgJCh0aGlzKS5hbmltYXRlKHsgd2lkdGg6IGAke3BlcmNlbnRNYXRjaH0lYCB9LCAxNTAwLCAnc3dpbmcnKVxuXG4gICAgfSk7XG4gICAgXG59O1xuXG5hcHAuZXZlbnRzID0gKCkgPT4ge1xuICAgIC8vIGUgZXZlbnRzIGhlcmUuIGZvcm0gc3VibWl0cywgY2xpY2tzIGV0Yy4uLlxuICAgICQoJy5zZWFyY2hGb3JtJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uKGUpe1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGFwcC5zZWFyY2hBcnRpc3QgPSAkKHRoaXMpLmZpbmQoJy5zZWFyY2hGb3JtX19pbnB1dCcpLnZhbCgpO1xuICAgICAgICBhcHAuZ2V0U2ltaWxhckFydGlzdHMoYXBwLnNlYXJjaEFydGlzdCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGFwcC5zZWFyY2hBcnRpc3QpO1xuICAgIH0pXG5cbiAgICAkKCcuYXJ0aXN0Q2FyZENvbnRhaW5lcicpLm9uKCdjbGljaycsICcuYXJ0aXN0Q2FyZF9fYmFubmVyJywgZnVuY3Rpb24oKXtcbiAgICAgICAgY29uc29sZS5sb2coJ0FSVElTVCBDQVJEIEJBTk5FUiBDTElDS0VEJylcbiAgICAgICAgY29uc3QgYXJ0aXN0ID0gJCh0aGlzKS5kYXRhKCdhcnRpc3QnKVxuICAgICAgICBjb25zb2xlLmxvZyhhcnRpc3QpXG4gICAgfSk7XG59O1xuXG5cbi8vIEluaXRpYWxpemUgYXBwXG5hcHAuaW5pdCA9ICgpID0+IHtcbiAgICBhcHAuZXZlbnRzKClcbn1cbi8vIEZ1bmN0aW9uIHJlYWR5XG4kKGFwcC5pbml0KVxuXG5cbi8vIERZTkFNSUMgTUFUQ0ggU0NBTEUgLSBmb3Igc2ltaWxhciBhcnRpc3RzIGVuZCBwb2ludCwgdGhlcmUgaXMgYSBtYXRjaCBzY29yZSByZWxldGl2ZSB0byB0aGUgc2VhcmNoZWQgYXJ0aXN0cyAwLTFcblxuLy8gb24gdXNlciBpbnB1dCAtIGdldFNpbWlsYXIiXX0=
