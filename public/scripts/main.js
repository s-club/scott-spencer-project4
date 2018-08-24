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
    $(".artistCard__expand").hide();
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

app.setDefaultState = function () {
    $('.artistCard__expand').hide();
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
        var artist = $(this).data('artist');
        $(".artistCard__expand").toggle(500);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsYUFBZDs7QUFFQSxJQUFNLE1BQU0sRUFBWjtBQUNBLE9BQU8sR0FBUCxHQUFhLEdBQWI7QUFDQTtBQUNBLElBQUksTUFBSjs7QUFFQSxJQUFJLGFBQUosR0FBb0I7QUFDaEIsWUFBUSxRQURRO0FBRWhCLGFBQVMsU0FGTztBQUdoQixnQkFBWSxZQUhJO0FBSWhCLGtCQUFjLGNBSkU7QUFLaEIsa0JBQWMsY0FMRTtBQU1oQixnQkFBWTs7QUFHaEI7QUFDQTtBQVZvQixDQUFwQixDQVdBLElBQUksV0FBSixHQUFrQixVQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLEtBQWpCLEVBQTJCO0FBQ3pDLFFBQUksU0FBSix3REFBbUUsTUFBbkU7QUFDQSxXQUFPLEVBQUUsSUFBRixDQUFPO0FBQ1YsYUFBSyxJQUFJLFNBREM7QUFFVixnQkFBUSxLQUZFO0FBR1Ysa0JBQVUsTUFIQTtBQUlWLGNBQU07QUFDRiwwQkFERTtBQUVGLHFCQUFTLElBQUksTUFGWDtBQUdGLHdCQUhFO0FBSUYsb0JBQVE7QUFKTjtBQUpJLEtBQVAsQ0FBUDtBQVdILENBYkQ7O0FBZUE7QUFDQTtBQUNBLElBQUksaUJBQUosR0FBd0IsVUFBQyxNQUFELEVBQVk7QUFDaEMsUUFBSSxXQUFKLENBQWdCLElBQUksYUFBSixDQUFrQixVQUFsQyxFQUE4QyxNQUE5QyxFQUNLLElBREwsQ0FDVSxVQUFDLEdBQUQsRUFBUztBQUNYLFlBQU0sU0FBUyxJQUFJLGNBQUosQ0FBbUIsTUFBbEM7QUFDQSxZQUFJLFlBQVksT0FDWCxNQURXLENBQ0osVUFBQyxNQUFEO0FBQUEsbUJBQVksT0FBTyxLQUFQLElBQWdCLEdBQTVCO0FBQUEsU0FESSxFQUVYLEdBRlcsQ0FFUCxVQUFDLE1BQUQsRUFBWTtBQUNiLG1CQUFPO0FB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VUFBRSxpQkFBRixFQUFxQixJQUFyQixDQUEwQixNQUExQixFQUFrQyxHQUFsQztBQUNBO0FBQ0gsS0FORDs7QUFRQSxNQUFFLHNCQUFGLEVBQTBCLEVBQTFCLENBQTZCLE9BQTdCLEVBQXNDLHFCQUF0QyxFQUE2RCxZQUFVO0FBQ25FLFlBQU0sU0FBUyxFQUFFLElBQUYsRUFBUSxJQUFSLENBQWEsUUFBYixDQUFmO0FBQ0EsVUFBRSxxQkFBRixFQUF5QixNQUF6QixDQUFnQyxHQUFoQztBQUNILEtBSEQ7QUFJSCxDQWREOztBQWdCQTtBQUNBLElBQUksSUFBSixHQUFXLFlBQU07QUFDYixRQUFJLE1BQUo7O0FBRUEsTUFBRSxpQkFBRixFQUFxQixJQUFyQixDQUEwQixNQUExQixFQUFrQyxHQUFsQztBQUVILENBTEQ7QUFNQTtBQUNBLEVBQUUsSUFBSSxJQUFOOztBQUdBOztBQUVBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3Qgb2hIZXkgPSBcIkhlbGxvIFdvcmxkXCI7XG5cbmNvbnN0IGFwcCA9IHt9O1xud2luZG93LmFwcCA9IGFwcDtcbi8vIExhc3QuZm0gc2ltaWxhciBhcnRpc3QgYXBpIHVybFxuYXBwLmFwaUtleSA9IGBhNTdlODNjNDkyYmM0YTBhYzM2ZjE4ZTQ3YWFhZjliN2BcblxuYXBwLmFydGlzdE1ldGhvZHMgPSB7XG4gICAgc2VhcmNoOiAnc2VhcmNoJyxcbiAgICBnZXRJbmZvOiAnZ2V0SW5mbycsXG4gICAgZ2V0U2ltaWxhcjogJ2dldFNpbWlsYXInLFxuICAgIGdldFRvcFRyYWNrczogJ2dldFRvcFRyYWNrcycsXG4gICAgZ2V0VG9wQWxidW1zOiAnZ2V0VG9wQWxidW1zJyxcbiAgICBnZXRUb3BUYWdzOiAnZ2V0VG9wVGFncycsXG59XG5cbi8vIEZ1bmN0aW9uIHRvIG1ha2UgYXBpIGNhbGxzIGZvciBhcnRpc3RzXG4vLyBQYXJhbSAxIC0gdGhlIHR5cGUgb2YgY2FsbCB5b3Ugd2FudCB0byBtYWtlIHwgUGFyYW0gMiAtIHRoZSBhcnRpc3QgeW91J3JlIG1ha2luZyB0aGUgcXVlcnlpbmcgZm9yXG5hcHAuYXJ0aXN0UXVlcnkgPSAobWV0aG9kLCBhcnRpc3QsIGxpbWl0KSA9PiB7XG4gICAgYXBwLmFydGlzdFVybCA9IGBodHRwOi8vd3MuYXVkaW9zY3JvYmJsZXIuY29tLzIuMC8/bWV0aG9kPWFydGlzdC4ke21ldGhvZH1gXG4gICAgcmV0dXJuICQuYWpheCh7XG4gICAgICAgIHVybDogYXBwLmFydGlzdFVybCxcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXJ0aXN0LFxuICAgICAgICAgICAgYXBpX2tleTogYXBwLmFwaUtleSxcbiAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgZm9ybWF0OiAnanNvbicsXG4gICAgICAgIH1cbiAgICB9KVxufTtcblxuLy8gXG4vLyBjcmVhdGUgYSBuZXcgYXJyYXkgb2Ygc2ltaWxhciBhcnRpc3QgbmFtZXMgdGhhdCB3ZSBjYW4gcGFzcyBhcyB0aGUgXCJhcnRpc3QgdmFsdWUgZm9yIG91ciBvdGhlciBhcGkgY2FsbHNcbmFwcC5nZXRTaW1pbGFyQXJ0aXN0cyA9IChhcnRpc3QpID0+IHtcbiAgICBhcHAuYXJ0aXN0UXVlcnkoYXBwLmFydGlzdE1ldGhvZHMuZ2V0U2ltaWxhciwgYXJ0aXN0KVxuICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhcnRpc3QgPSByZXMuc2ltaWxhcmFydGlzdHMuYXJ0aXN0O1xuICAgICAgICAgICAgbGV0IGFydGlzdEFyciA9IGFydGlzdFxuICAgICAgICAgICAgICAgIC5maWx0ZXIoKGFydGlzdCkgPT4gYXJ0aXN0Lm1hdGNoID49IC4yNSlcbiAgICAgICAgICAgICAgICAubWFwKChhcnRpc3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFydGlzdC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IGFydGlzdC5tYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gZ2V0IGdlbnJlIHRhZ3MgZm9yIHRoZSBzaW1pbGFyIGFydGlzdHMsIGFkZCB0YWdzIGFzIHByb3BlcnR5IG9uIGFydGlzdHNBcnJcbiAgICAgICAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICBhcHAuZ2V0U2ltaWxhckFydGlzdFRhZ3MoYXJ0aXN0QXJyKSxcbiAgICAgICAgICAgICAgICAvLyBnZXQgdG9wIGFsYnVtcyBmb3IgdGhlIHNpbWlsYXIgYXJ0aXN0cyBcbiAgICAgICAgICAgICAgICBhcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BBbGJ1bXMoYXJ0aXN0QXJyKSxcbiAgICAgICAgICAgICAgICAvLyBnZXQgdG9wIHRyYWNrcyBmb3IgdGhlIHNpbWlsYXIgYXJ0aXN0cywgYWRkIHRyYWNrcyBhcyBwcm9wZXJ0eSBvbiBhcnRpc3RzQXJyXG4gICAgICAgICAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RzVG9wVHJhY2tzKGFydGlzdEFycildKVxuICAgICAgICAgICAgICAgIC50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICBhcHAuY3JlYXRlQXJ0aXN0Q2FyZChhcnRpc3RBcnIpXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAkKFwiLmxvYWRpbmdPdmVybGF5XCIpLmhpZGUoXCJmYWRlXCIsIDUwMClcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYXJ0aXN0QXJyKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxufVxuXG5hcHAuZ2V0U2ltaWxhckFydGlzdFRhZ3MgPSAoYXJyYXkpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcykgPT4ge1xuICAgICAgICBhcnJheSA9IGFycmF5Lm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRUb3BUYWdzLCBpdGVtLm5hbWUpXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgYSB2YXJpYWJsZSBmb3IgdGhlIHRhZ3MgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFncyA9IHJlcy50b3B0YWdzLnRhZ1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGdldCB0aGUgYXJ0aXN0IGFzc29jaWF0ZWQgd2l0aCBlYWNoIHRhZ3MgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJ0aXN0ID0gYXBwLmdldEFydGlzdEZyb21SZXMocmVzLnRvcHRhZ3MpXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZmlsdGVyIHRoZSB0YWdzIHRvIHRob3NlIHdobyBhcmUgYSBtYXRjaCA+PSAxMCwgdGhlbiBzdHJpcCB0aGVtIHRvIHRoZSBlc3NlbnRpYWwgaW5mbyB1c2luZyBtYXBcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFnQXJyID0gdGFnc1xuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigodGFnKSA9PiB0YWcuY291bnQgPj0gMjAgJiYgdGFnLm5hbWUgIT09IFwic2VlbiBsaXZlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKCh0YWcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0YWcubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsZXZhbmN5OiB0YWcuY291bnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSB0YWcgYXJ0aXN0IG1hdGNoZXMgdGhlIGluaXRpYWwgYXJyYXkgaXRlbSdzIGFydGlzdCwgYWRkIHRoZSB0YWdzIGFzIGEgcHJvcGVydHkgb2YgdGhhdCBpdGVtXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcnRpc3QgPT09IGl0ZW0ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS50YWdzID0gdGFnQXJyXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBQcm9taXNlLmFsbChhcnJheSlcbiAgICAgICAgICAgIC50aGVuKHJlcyk7XG4gICAgfSk7XG59XG4vLyB0YWtlIGFuIGFycmF5IG9mIGFsbCB0aGUgc2ltaWxhciBhcnRpc3RzXG4vLyBpdGVyYXRlIG92ZXIgZWFjaCBhcnRpc3QgYW5kIHN1Ym1pdCBhbiBhcGkgcmVxdWVzdCB1c2luZyAkLndoZW4gZm9yIC5nZXRUb3BUcmFja3NcbmFwcC5nZXRTaW1pbGFyQXJ0aXN0c1RvcFRyYWNrcyA9IChhcnJheSkgPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzKSA9PiB7XG4gICAgICAgIGFycmF5ID0gYXJyYXkubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFRvcFRyYWNrcywgaXRlbS5uYW1lLCAxMClcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXMudG9wdHJhY2tzKTtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgYSB2YXJpYWJsZSBmb3IgdGhlIHRyYWNrcyBhcnJheVxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNrcyA9IHJlcy50b3B0cmFja3MudHJhY2tcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIGFydGlzdCBhc3NvY2lhdGVkIHdpdGggZWFjaCB0cmFja3MgYXJyYXlcbiAgICAgICAgICAgICAgICBjb25zdCBhcnRpc3QgPSBhcHAuZ2V0QXJ0aXN0RnJvbVJlcyhyZXMudG9wdHJhY2tzKVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIE1hcCB0aGUgYXJyYXkgb2YgdHJhY2tzIHJldHVybmVkIGJ5IHRoZSBhcGkgdG8gY29udGFpbiBvbmx5IHRoZSBwcm9wZXJ0aWVzIHdlIHdhbnRcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3NBcnIgPSB0cmFja3NcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoc29uZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHNvbmcubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnM6IHNvbmcubGlzdGVuZXJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYXljb3VudDogc29uZy5wbGF5Y291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGlnIHRocm91Z2ggdGhlIHRoZSBhcnJheSBvZiBpbWFnZSBvYmplY3RzIHRvIHJldHVybiBvbmx5IHRoZSB1cmwgb2YgdGhlIGV4dHJhbGFyZ2Ugc2l6ZWQgaW1hZ2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiBzb25nLmltYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChpbWcpID0+IGltZy5zaXplID09PSBcImV4dHJhbGFyZ2VcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKGltZykgPT4gaW1nW1wiI3RleHRcIl0pLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSB0cmFjayBhcnRpc3QgbWF0Y2hlcyB0aGUgaW5pdGlhbCBhcnJheSBpdGVtJ3MgYXJ0aXN0LCBhZGQgdHJhY2tzIGFzIGEgcHJvcGVydHkgb2YgdGhhdCBpdGVtXG4gICAgICAgICAgICAgICAgaWYgKGFydGlzdCA9PT0gaXRlbS5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udHJhY2tzID0gdHJhY2tzQXJyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBQcm9taXNlLmFsbChhcnJheSlcbiAgICAgICAgICAgIC50aGVuKHJlcyk7XG4gICAgfSk7XG59XG5cbmFwcC5nZXRTaW1pbGFyQXJ0aXN0c1RvcEFsYnVtcyA9IChhcnJheSkgPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzKSA9PiB7XG4gICAgICAgIGFycmF5ID0gYXJyYXkubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFRvcEFsYnVtcywgaXRlbS5uYW1lLCA1KVxuICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFydGlzdCA9IGFwcC5nZXRBcnRpc3RGcm9tUmVzKHJlcy50b3BhbGJ1bXMpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGFydGlzdCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxidW1zID0gcmVzLnRvcGFsYnVtcy5hbGJ1bVxuICAgICAgICAgICAgICAgIC8vIE1hcCB0aGUgYXJyYXkgb2YgYWxidW1zIHJldHVybmVkIGJ5IHRoZSBBUEkgdG8gZGlzcGxheSBvbmx5IHRoZSBjb250ZW50IHdlIHdhbnRcbiAgICAgICAgICAgICAgICBjb25zdCBhbGJ1bUFyciA9IGFsYnVtcy5cbiAgICAgICAgICAgICAgICBtYXAoKGFsYnVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybntcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFsYnVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF5Y291bnQ6IGFsYnVtLnBsYXljb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlOiBhbGJ1bS5pbWFnZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcigoaW1nKSA9PiBpbWcuc2l6ZSA9PT0gXCJleHRyYWxhcmdlXCIpLlxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwKChpbWcpID0+IGltZ1tcIiN0ZXh0XCJdKS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyBNYXAgaWYgYWxidW0gYXJ0aXN0IG1hdGNoZXMgdGhlIGluaXRpYWwgYXJyYXkgaXRlbXMgYXJ0aXN0XG4gICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBhbGJ1bSBhcnJheSBhcyBhIHByb3BlcnR5IG9mIHRoYXQgaXRlbVxuICAgIFxuICAgICAgICAgICAgICAgIGlmKGFydGlzdCA9PT0gaXRlbS5uYW1lKXtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5hbGJ1bXMgPSBhbGJ1bUFycjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJhcnRpc3RcIiwgYXJ0aXN0LCBcIkl0ZW06XCIsIGl0ZW0ubmFtZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICAgIFByb21pc2UuYWxsKGFycmF5KVxuICAgICAgICAgICAgLnRoZW4ocmVzKTtcbiAgICB9KTtcbn1cblxuYXBwLmdldEFydGlzdEZyb21SZXMgPSAocm9vdE9iamVjdCkgPT4ge1xuICAgIHJldHVybiByb290T2JqZWN0WydAYXR0ciddLmFydGlzdFxufTtcblxuYXBwLmNyZWF0ZUFydGlzdENhcmQgPSAoYXJyYXkpID0+IHtcbiAgICAkKCcuYXJ0aXN0Q2FyZENvbnRhaW5lcicpLmVtcHR5KClcbiAgICBhcnJheS5mb3JFYWNoKChhcnRpc3QpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coTWF0aC5mbG9vcihOdW1iZXIoYXJ0aXN0Lm1hdGNoKS50b0ZpeGVkKDIpICogMTAwKS50b1N0cmluZygpKTtcblxuICAgICAgICBjb25zdCBhcnRpc3RDYXJkID0gJChcIjxzZWN0aW9uPlwiKS5hZGRDbGFzcygnYXJ0aXN0Q2FyZCcpXG4gICAgICAgIGNvbnN0IHBlcmNlbnRNYXRjaCA9IE1hdGguZmxvb3IoTnVtYmVyKGFydGlzdC5tYXRjaCkudG9GaXhlZCgyKSAqIDEwMClcbiAgICAgICAgJCgnLmFydGlzdENhcmRDb250YWluZXInKS5hcHBlbmQoYXJ0aXN0Q2FyZClcblxuICAgICAgICAkKGFydGlzdENhcmQpLmFwcGVuZChgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX2Jhbm5lclwiIGRhdGEtYXJ0aXN0PVwiJHthcnRpc3QubmFtZX1cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkX19uYW1lXCI+XG4gICAgICAgICAgICAgICAgPGgzPiR7YXJ0aXN0Lm5hbWV9PC9oMz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmQgYXJ0aXN0Q2FyZF9fbWF0Y2hcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fbWF0Y2ggYXJ0aXN0Q2FyZF9fbWF0Y2gtLW91dGVyQmFyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkX19tYXRjaCBhcnRpc3RDYXJkX19tYXRjaC0taW5uZXJCYXJcIiBkYXRhLXBlcmNlbnRNYXRjaD1cIiR7cGVyY2VudE1hdGNofVwiPiR7cGVyY2VudE1hdGNofSU8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX2V4cGFuZFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmQgYXJ0aXN0Q2FyZF9fdGFnc1wiPlxuICAgICAgICAgICAgICAgIDx1bD48L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX190cmFja3NcIj5cbiAgICAgICAgICAgICAgICA8dWw+PC91bD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmQgYXJ0aXN0Q2FyZF9fYWxidW1zXCI+XG4gICAgICAgICAgICAgICAgPHVsPjwvdWw+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIGApXG4gICAgfSk7XG4gICAgLy8gYWRkIHRhZ3MgdG8gZG9tXG4gICAgYXBwLmFkZFByb3BzVG9Eb20oYXJyYXksIFwidGFnc1wiKVxuXG4gICAgLy8gYWRkIHRyYWNrcyB0byBkb21cbiAgICBhcHAuYWRkUHJvcHNUb0RvbShhcnJheSwgXCJ0cmFja3NcIilcblxuICAgIC8vIGFkZCBhbGJ1bXMgdG8gZG9tXG4gICAgYXBwLmFkZFByb3BzVG9Eb20oYXJyYXksIFwiYWxidW1zXCIpXG5cbiAgICAvLyBtYWtlIHRoZSBtYXRjaCBwZXJjZW50IG1ldGVyIHJlZmxlY3QgdGhlIG1hdGNoIHZhbHVlXG4gICAgYXBwLnBlcmNlbnRNYXRjaCgpXG5cbn1cblxuLy8gRnVuY3Rpb24gdG8gYWRkIHByb3BlcnR5IHRvIERPTVxuYXBwLmFkZFByb3BzVG9Eb20gPSAoYXJyYXksIHByb3ApID0+IHtcbiAgICAvLyBmb3IgZWFjaCBhcnRpc3QgY2FyZCBiYW5uZXIuLi53ZSBkbyB0aGUgZm9sbG93aW5nOlxuICAgICQoXCIuYXJ0aXN0Q2FyZF9fYmFubmVyXCIpLmVhY2goZnVuY3Rpb24oKXtcbiAgICAgICAgLy8gIGl0ZXJhdGUgdGhyb3VnaCBldmVyeSBhcnRpc3QgaW4gb3VyIHNpbWlsYXIgYXJ0aXN0cyBhcnJheVxuICAgICAgICBhcnJheS5mb3JFYWNoKChhcnRpc3QpID0+IHtcbiAgICAgICAgICAgIC8vIHNhdmUgdGhlIGRpdidzIGFydGlzdCBkYXRhIHRhZ1xuICAgICAgICAgICAgY29uc3QgYXJ0aXN0RGF0YSA9ICQodGhpcykuZGF0YSgnYXJ0aXN0JylcbiAgICAgICAgICAgIC8vIGlmIHRoZSBhcnRpc3QgZGF0YSB0YWcgdGhhdCB3ZSBhcmUgY3VycmVudHkgaXRlcmF0aW5nIHRob3VnaCBtYXRjaGVzIHRoZSBzaW1pbGFyIGFydGlzdCdzIG5hbWUgdGhhdCB3ZSdyZSBpdGVyYXRpbmcgdGhyb3VnaCBmaW5kIHRoZSB1bCBpdCBiZWxvbmdzIHRvIGFuZCBhcHBlbmQgaXRzIG5hbWUgYXMgYW4gbGlcbiAgICAgICAgICAgIGlmIChhcnRpc3QubmFtZSA9PT0gYXJ0aXN0RGF0YSkge1xuICAgICAgICAgICAgICAgIGFydGlzdFtwcm9wXS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmKGl0ZW0ucGxheWNvdW50ICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5maW5kKGAuYXJ0aXN0Q2FyZF9fJHtwcm9wfSB1bGApLmFwcGVuZChgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoND4ke2l0ZW0ubmFtZX08L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoND5UaW1lcyBwbGF5ZWQ6ICR7aXRlbS5wbGF5Y291bnR9PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+YClcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNle1xuICAgICAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5maW5kKGAuYXJ0aXN0Q2FyZF9fJHtwcm9wfSB1bGApLmFwcGVuZChgPGxpPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxoND4ke2l0ZW0ubmFtZX08L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5gKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG4gICAgJChcIi5hcnRpc3RDYXJkX19leHBhbmRcIikuaGlkZSgpO1xufVxuXG5cbi8vIEEgZnVuY3Rpb24gdG8gbWFrZSB0aGUgXCJtYXRjaCBtZXRlclwiIG1hdGNoIGl0J3Mgd2lkdGggJSB0byBpdCdzIGRhdGEoJ3BlcmNlbnRtYXRjaCcpIHZhbHVlXG5hcHAucGVyY2VudE1hdGNoID0gKCkgPT4ge1xuICAgICQoJy5hcnRpc3RDYXJkX19tYXRjaC0taW5uZXJCYXInKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJCh0aGlzKSk7XG4gICAgICAgIGNvbnN0IHBlcmNlbnRNYXRjaCA9ICQodGhpcykuZGF0YSgncGVyY2VudG1hdGNoJylcbiAgICAgICAgJCh0aGlzKS53aWR0aChgMHB4YClcbiAgICAgICAgJCh0aGlzKS5hbmltYXRlKHsgd2lkdGg6IGAke3BlcmNlbnRNYXRjaH0lYCB9LCAxNTAwLCAnc3dpbmcnKVxuXG4gICAgfSk7XG4gICAgXG59O1xuXG5hcHAuc2V0RGVmYXVsdFN0YXRlID0gKCkgPT4ge1xuICAgICQoJy5hcnRpc3RDYXJkX19leHBhbmQnKS5oaWRlKCk7XG59XG4gXG5hcHAuZXZlbnRzID0gKCkgPT4ge1xuICAgIC8vIGUgZXZlbnRzIGhlcmUuIGZvcm0gc3VibWl0cywgY2xpY2tzIGV0Yy4uLlxuICAgICQoJy5zZWFyY2hGb3JtJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uKGUpe1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGFwcC5zZWFyY2hBcnRpc3QgPSAkKHRoaXMpLmZpbmQoJy5zZWFyY2hGb3JtX19pbnB1dCcpLnZhbCgpO1xuICAgICAgICBhcHAuZ2V0U2ltaWxhckFydGlzdHMoYXBwLnNlYXJjaEFydGlzdCk7XG4gICAgICAgICQoXCIubG9hZGluZ092ZXJsYXlcIikuc2hvdyhcImZhZGVcIiwgNTAwKVxuICAgICAgICAvLyBjb25zb2xlLmxvZyhhcHAuc2VhcmNoQXJ0aXN0KTtcbiAgICB9KVxuXG4gICAgJCgnLmFydGlzdENhcmRDb250YWluZXInKS5vbignY2xpY2snLCAnLmFydGlzdENhcmRfX2Jhbm5lcicsIGZ1bmN0aW9uKCl7XG4gICAgICAgIGNvbnN0IGFydGlzdCA9ICQodGhpcykuZGF0YSgnYXJ0aXN0JylcbiAgICAgICAgJChcIi5hcnRpc3RDYXJkX19leHBhbmRcIikudG9nZ2xlKDUwMCk7XG4gICAgfSk7XG59O1xuXG4vLyBJbml0aWFsaXplIGFwcFxuYXBwLmluaXQgPSAoKSA9PiB7XG4gICAgYXBwLmV2ZW50cygpXG5cbiAgICAkKFwiLmxvYWRpbmdPdmVybGF5XCIpLmhpZGUoXCJmYWRlXCIsIDUwMClcblxufVxuLy8gRnVuY3Rpb24gcmVhZHlcbiQoYXBwLmluaXQpXG5cblxuLy8gRFlOQU1JQyBNQVRDSCBTQ0FMRSAtIGZvciBzaW1pbGFyIGFydGlzdHMgZW5kIHBvaW50LCB0aGVyZSBpcyBhIG1hdGNoIHNjb3JlIHJlbGV0aXZlIHRvIHRoZSBzZWFyY2hlZCBhcnRpc3RzIDAtMVxuXG4vLyBvbiB1c2VyIGlucHV0IC0gZ2V0U2ltaWxhciJdfQ==
