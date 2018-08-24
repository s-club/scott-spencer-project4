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

        $(artistCard).append('\n        <div class="artistCard artistCard__banner" data-artist="' + artist.name + '">\n            <div class="artistCard artistCard__name">\n                <h3>' + artist.name + '</h3>\n                <i class="fas fa-chevron-down"></i>\n            </div>\n            <div class="artistCard artistCard__match">\n                <div class="artistCard__match artistCard__match--outerBar">\n                    <div class="artistCard__match artistCard__match--innerBar" data-percentMatch="' + percentMatch + '">' + percentMatch + '%</div>\n\t\t\t\t</div>\n\t\t\t</div>\n        </div>\n        <div class="artistCard artistCard__expand">\n            <div class="artistCard artistCard__tags">\n                <ul></ul>\n            </div>\n            <div class="artistCard artistCard__tracks">\n                <ul></ul>\n            </div>\n            <div class="artistCard artistCard__albums">\n                <ul></ul>\n            </div>\n        </div>\n        ');
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
        $(this).parent().find(".artistCard__expand").toggle("slide", { direction: "up" }, 500);
    });

    // $('.searchForm').find('input')
    $('.searchForm').find('.searchForm__input').on('keyup', function (e) {
        var inputVal = $(this).val();
        if (inputVal !== "") {
            $(this).parent().find('label').css({ left: '7%' });
        } else {
            $(this).parent().find('label').css({ left: '50%', transform: 'translateX(-50%)' });
        }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsYUFBZDs7QUFFQSxJQUFNLE1BQU0sRUFBWjtBQUNBLE9BQU8sR0FBUCxHQUFhLEdBQWI7QUFDQTtBQUNBLElBQUksTUFBSjs7QUFFQSxJQUFJLGFBQUosR0FBb0I7QUFDaEIsWUFBUSxRQURRO0FBRWhCLGFBQVMsU0FGTztBQUdoQixnQkFBWSxZQUhJO0FBSWhCLGtCQUFjLGNBSkU7QUFLaEIsa0JBQWMsY0FMRTtBQU1oQixnQkFBWTs7QUFHaEI7QUFDQTtBQVZvQixDQUFwQixDQVdBLElBQUksV0FBSixHQUFrQixVQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLEtBQWpCLEVBQTJCO0FBQ3pDLFFBQUksU0FBSix3REFBbUUsTUFBbkU7QUFDQSxXQUFPLEVBQUUsSUFBRixDQUFPO0FBQ1YsYUFBSyxJQUFJLFNBREM7QUFFVixnQkFBUSxLQUZFO0FBR1Ysa0JBQVUsTUFIQTtBQUlWLGNBQU07QUFDRiwwQkFERTtBQUVGLHFCQUFTLElBQUksTUFGWDtBQUdGLHdCQUhFO0FBSUYsb0JBQVE7QUFKTjtBQUpJLEtBQVAsQ0FBUDtBQVdILENBYkQ7O0FBZUE7QUFDQTtBQUNBLElBQUksaUJBQUosR0FBd0IsVUFBQyxNQUFELEVBQVk7QUFDaEMsUUFBSSxXQUFKLENBQWdCLElBQUksYUFBSixDQUFrQixVQUFsQyxFQUE4QyxNQUE5QyxFQUNLLElBREwsQ0FDVSxVQUFDLEdBQUQsRUFBUztBQUNYLFlBQU0sU0FBUyxJQUFJLGNBQUosQ0FBbUIsTUFBbEM7QUFDQSxZQUFJLFlBQVksT0FDWCxNQURXLENBQ0osVUFBQyxNQUFEO0FBQUEsbUJBQVksT0FBTyxLQUFQLElBQWdCLEdBQTVCO0FBQUEsU0FESSxFQUVYLEdBRlcsQ0FFUCxVQUFDLE1BQUQsRUFBWTtBQUNiLG1CQUFPO0FB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KGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IG9oSGV5ID0gXCJIZWxsbyBXb3JsZFwiO1xuXG5jb25zdCBhcHAgPSB7fTtcbndpbmRvdy5hcHAgPSBhcHA7XG4vLyBMYXN0LmZtIHNpbWlsYXIgYXJ0aXN0IGFwaSB1cmxcbmFwcC5hcGlLZXkgPSBgYTU3ZTgzYzQ5MmJjNGEwYWMzNmYxOGU0N2FhYWY5YjdgXG5cbmFwcC5hcnRpc3RNZXRob2RzID0ge1xuICAgIHNlYXJjaDogJ3NlYXJjaCcsXG4gICAgZ2V0SW5mbzogJ2dldEluZm8nLFxuICAgIGdldFNpbWlsYXI6ICdnZXRTaW1pbGFyJyxcbiAgICBnZXRUb3BUcmFja3M6ICdnZXRUb3BUcmFja3MnLFxuICAgIGdldFRvcEFsYnVtczogJ2dldFRvcEFsYnVtcycsXG4gICAgZ2V0VG9wVGFnczogJ2dldFRvcFRhZ3MnLFxufVxuXG4vLyBGdW5jdGlvbiB0byBtYWtlIGFwaSBjYWxscyBmb3IgYXJ0aXN0c1xuLy8gUGFyYW0gMSAtIHRoZSB0eXBlIG9mIGNhbGwgeW91IHdhbnQgdG8gbWFrZSB8IFBhcmFtIDIgLSB0aGUgYXJ0aXN0IHlvdSdyZSBtYWtpbmcgdGhlIHF1ZXJ5aW5nIGZvclxuYXBwLmFydGlzdFF1ZXJ5ID0gKG1ldGhvZCwgYXJ0aXN0LCBsaW1pdCkgPT4ge1xuICAgIGFwcC5hcnRpc3RVcmwgPSBgaHR0cDovL3dzLmF1ZGlvc2Nyb2JibGVyLmNvbS8yLjAvP21ldGhvZD1hcnRpc3QuJHttZXRob2R9YFxuICAgIHJldHVybiAkLmFqYXgoe1xuICAgICAgICB1cmw6IGFwcC5hcnRpc3RVcmwsXG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGFydGlzdCxcbiAgICAgICAgICAgIGFwaV9rZXk6IGFwcC5hcGlLZXksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIGZvcm1hdDogJ2pzb24nLFxuICAgICAgICB9XG4gICAgfSlcbn07XG5cbi8vIFxuLy8gY3JlYXRlIGEgbmV3IGFycmF5IG9mIHNpbWlsYXIgYXJ0aXN0IG5hbWVzIHRoYXQgd2UgY2FuIHBhc3MgYXMgdGhlIFwiYXJ0aXN0IHZhbHVlIGZvciBvdXIgb3RoZXIgYXBpIGNhbGxzXG5hcHAuZ2V0U2ltaWxhckFydGlzdHMgPSAoYXJ0aXN0KSA9PiB7XG4gICAgYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFNpbWlsYXIsIGFydGlzdClcbiAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXJ0aXN0ID0gcmVzLnNpbWlsYXJhcnRpc3RzLmFydGlzdDtcbiAgICAgICAgICAgIGxldCBhcnRpc3RBcnIgPSBhcnRpc3RcbiAgICAgICAgICAgICAgICAuZmlsdGVyKChhcnRpc3QpID0+IGFydGlzdC5tYXRjaCA+PSAuMjUpXG4gICAgICAgICAgICAgICAgLm1hcCgoYXJ0aXN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBhcnRpc3QubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoOiBhcnRpc3QubWF0Y2gsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIGdldCBnZW5yZSB0YWdzIGZvciB0aGUgc2ltaWxhciBhcnRpc3RzLCBhZGQgdGFncyBhcyBwcm9wZXJ0eSBvbiBhcnRpc3RzQXJyXG4gICAgICAgICAgICBQcm9taXNlLmFsbChbXG4gICAgICAgICAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RUYWdzKGFydGlzdEFyciksXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRvcCBhbGJ1bXMgZm9yIHRoZSBzaW1pbGFyIGFydGlzdHMgXG4gICAgICAgICAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RzVG9wQWxidW1zKGFydGlzdEFyciksXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRvcCB0cmFja3MgZm9yIHRoZSBzaW1pbGFyIGFydGlzdHMsIGFkZCB0cmFja3MgYXMgcHJvcGVydHkgb24gYXJ0aXN0c0FyclxuICAgICAgICAgICAgICAgIGFwcC5nZXRTaW1pbGFyQXJ0aXN0c1RvcFRyYWNrcyhhcnRpc3RBcnIpXSlcbiAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgYXBwLmNyZWF0ZUFydGlzdENhcmQoYXJ0aXN0QXJyKVxuXG4gICAgICAgICAgICAgICAgICAgICQoXCIubG9hZGluZ092ZXJsYXlcIikuaGlkZShcImZhZGVcIiwgNTAwKVxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhcnRpc3RBcnIpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG59XG5cbmFwcC5nZXRTaW1pbGFyQXJ0aXN0VGFncyA9IChhcnJheSkgPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzKSA9PiB7XG4gICAgICAgIGFycmF5ID0gYXJyYXkubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFRvcFRhZ3MsIGl0ZW0ubmFtZSlcbiAgICAgICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBhIHZhcmlhYmxlIGZvciB0aGUgdGFncyBhcnJheVxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YWdzID0gcmVzLnRvcHRhZ3MudGFnXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBhcnRpc3QgYXNzb2NpYXRlZCB3aXRoIGVhY2ggdGFncyBhcnJheVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhcnRpc3QgPSBhcHAuZ2V0QXJ0aXN0RnJvbVJlcyhyZXMudG9wdGFncylcblxuICAgICAgICAgICAgICAgICAgICAvLyBmaWx0ZXIgdGhlIHRhZ3MgdG8gdGhvc2Ugd2hvIGFyZSBhIG1hdGNoID49IDEwLCB0aGVuIHN0cmlwIHRoZW0gdG8gdGhlIGVzc2VudGlhbCBpbmZvIHVzaW5nIG1hcFxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0YWdBcnIgPSB0YWdzXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKCh0YWcpID0+IHRhZy5jb3VudCA+PSAyMCAmJiB0YWcubmFtZSAhPT0gXCJzZWVuIGxpdmVcIilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKHRhZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRhZy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxldmFuY3k6IHRhZy5jb3VudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdGhlIHRhZyBhcnRpc3QgbWF0Y2hlcyB0aGUgaW5pdGlhbCBhcnJheSBpdGVtJ3MgYXJ0aXN0LCBhZGQgdGhlIHRhZ3MgYXMgYSBwcm9wZXJ0eSBvZiB0aGF0IGl0ZW1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFydGlzdCA9PT0gaXRlbS5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnRhZ3MgPSB0YWdBcnJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIFByb21pc2UuYWxsKGFycmF5KVxuICAgICAgICAgICAgLnRoZW4ocmVzKTtcbiAgICB9KTtcbn1cbi8vIHRha2UgYW4gYXJyYXkgb2YgYWxsIHRoZSBzaW1pbGFyIGFydGlzdHNcbi8vIGl0ZXJhdGUgb3ZlciBlYWNoIGFydGlzdCBhbmQgc3VibWl0IGFuIGFwaSByZXF1ZXN0IHVzaW5nICQud2hlbiBmb3IgLmdldFRvcFRyYWNrc1xuYXBwLmdldFNpbWlsYXJBcnRpc3RzVG9wVHJhY2tzID0gKGFycmF5KSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMpID0+IHtcbiAgICAgICAgYXJyYXkgPSBhcnJheS5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhcHAuYXJ0aXN0UXVlcnkoYXBwLmFydGlzdE1ldGhvZHMuZ2V0VG9wVHJhY2tzLCBpdGVtLm5hbWUsIDEwKVxuICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHJlcy50b3B0cmFja3MpO1xuICAgICAgICAgICAgICAgIC8vIGNyZWF0ZSBhIHZhcmlhYmxlIGZvciB0aGUgdHJhY2tzIGFycmF5XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2tzID0gcmVzLnRvcHRyYWNrcy50cmFja1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGdldCB0aGUgYXJ0aXN0IGFzc29jaWF0ZWQgd2l0aCBlYWNoIHRyYWNrcyBhcnJheVxuICAgICAgICAgICAgICAgIGNvbnN0IGFydGlzdCA9IGFwcC5nZXRBcnRpc3RGcm9tUmVzKHJlcy50b3B0cmFja3MpXG4gICAgXG4gICAgICAgICAgICAgICAgLy8gTWFwIHRoZSBhcnJheSBvZiB0cmFja3MgcmV0dXJuZWQgYnkgdGhlIGFwaSB0byBjb250YWluIG9ubHkgdGhlIHByb3BlcnRpZXMgd2Ugd2FudFxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNrc0FyciA9IHRyYWNrc1xuICAgICAgICAgICAgICAgICAgICAubWFwKChzb25nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogc29uZy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyczogc29uZy5saXN0ZW5lcnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGxheWNvdW50OiBzb25nLnBsYXljb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkaWcgdGhyb3VnaCB0aGUgdGhlIGFycmF5IG9mIGltYWdlIG9iamVjdHMgdG8gcmV0dXJuIG9ubHkgdGhlIHVybCBvZiB0aGUgZXh0cmFsYXJnZSBzaXplZCBpbWFnZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWc6IHNvbmcuaW1hZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKGltZykgPT4gaW1nLnNpemUgPT09IFwiZXh0cmFsYXJnZVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoaW1nKSA9PiBpbWdbXCIjdGV4dFwiXSkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gaWYgdGhlIHRyYWNrIGFydGlzdCBtYXRjaGVzIHRoZSBpbml0aWFsIGFycmF5IGl0ZW0ncyBhcnRpc3QsIGFkZCB0cmFja3MgYXMgYSBwcm9wZXJ0eSBvZiB0aGF0IGl0ZW1cbiAgICAgICAgICAgICAgICBpZiAoYXJ0aXN0ID09PSBpdGVtLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS50cmFja3MgPSB0cmFja3NBcnJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIFByb21pc2UuYWxsKGFycmF5KVxuICAgICAgICAgICAgLnRoZW4ocmVzKTtcbiAgICB9KTtcbn1cblxuYXBwLmdldFNpbWlsYXJBcnRpc3RzVG9wQWxidW1zID0gKGFycmF5KSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMpID0+IHtcbiAgICAgICAgYXJyYXkgPSBhcnJheS5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhcHAuYXJ0aXN0UXVlcnkoYXBwLmFydGlzdE1ldGhvZHMuZ2V0VG9wQWxidW1zLCBpdGVtLm5hbWUsIDUpXG4gICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXJ0aXN0ID0gYXBwLmdldEFydGlzdEZyb21SZXMocmVzLnRvcGFsYnVtcyk7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYXJ0aXN0KTtcbiAgICAgICAgICAgICAgICBjb25zdCBhbGJ1bXMgPSByZXMudG9wYWxidW1zLmFsYnVtXG4gICAgICAgICAgICAgICAgLy8gTWFwIHRoZSBhcnJheSBvZiBhbGJ1bXMgcmV0dXJuZWQgYnkgdGhlIEFQSSB0byBkaXNwbGF5IG9ubHkgdGhlIGNvbnRlbnQgd2Ugd2FudFxuICAgICAgICAgICAgICAgIGNvbnN0IGFsYnVtQXJyID0gYWxidW1zLlxuICAgICAgICAgICAgICAgIG1hcCgoYWxidW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYWxidW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXljb3VudDogYWxidW0ucGxheWNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2U6IGFsYnVtLmltYWdlLlxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyKChpbWcpID0+IGltZy5zaXplID09PSBcImV4dHJhbGFyZ2VcIikuXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXAoKGltZykgPT4gaW1nW1wiI3RleHRcIl0pLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIC8vIE1hcCBpZiBhbGJ1bSBhcnRpc3QgbWF0Y2hlcyB0aGUgaW5pdGlhbCBhcnJheSBpdGVtcyBhcnRpc3RcbiAgICAgICAgICAgICAgICAvLyBBZGQgdGhlIGFsYnVtIGFycmF5IGFzIGEgcHJvcGVydHkgb2YgdGhhdCBpdGVtXG4gICAgXG4gICAgICAgICAgICAgICAgaWYoYXJ0aXN0ID09PSBpdGVtLm5hbWUpe1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmFsYnVtcyA9IGFsYnVtQXJyO1xuICAgICAgICAgICAgICAgIH1cbiAgICBcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImFydGlzdFwiLCBhcnRpc3QsIFwiSXRlbTpcIiwgaXRlbS5uYW1lKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgICAgUHJvbWlzZS5hbGwoYXJyYXkpXG4gICAgICAgICAgICAudGhlbihyZXMpO1xuICAgIH0pO1xufVxuXG5hcHAuZ2V0QXJ0aXN0RnJvbVJlcyA9IChyb290T2JqZWN0KSA9PiB7XG4gICAgcmV0dXJuIHJvb3RPYmplY3RbJ0BhdHRyJ10uYXJ0aXN0XG59O1xuXG5hcHAuY3JlYXRlQXJ0aXN0Q2FyZCA9IChhcnJheSkgPT4ge1xuICAgICQoJy5hcnRpc3RDYXJkQ29udGFpbmVyJykuZW1wdHkoKVxuICAgIGFycmF5LmZvckVhY2goKGFydGlzdCkgPT4ge1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhNYXRoLmZsb29yKE51bWJlcihhcnRpc3QubWF0Y2gpLnRvRml4ZWQoMikgKiAxMDApLnRvU3RyaW5nKCkpO1xuXG4gICAgICAgIGNvbnN0IGFydGlzdENhcmQgPSAkKFwiPHNlY3Rpb24+XCIpLmFkZENsYXNzKCdhcnRpc3RDYXJkJylcbiAgICAgICAgY29uc3QgcGVyY2VudE1hdGNoID0gTWF0aC5mbG9vcihOdW1iZXIoYXJ0aXN0Lm1hdGNoKS50b0ZpeGVkKDIpICogMTAwKVxuICAgICAgICAkKCcuYXJ0aXN0Q2FyZENvbnRhaW5lcicpLmFwcGVuZChhcnRpc3RDYXJkKVxuXG4gICAgICAgICQoYXJ0aXN0Q2FyZCkuYXBwZW5kKGBcbiAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmQgYXJ0aXN0Q2FyZF9fYmFubmVyXCIgZGF0YS1hcnRpc3Q9XCIke2FydGlzdC5uYW1lfVwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmQgYXJ0aXN0Q2FyZF9fbmFtZVwiPlxuICAgICAgICAgICAgICAgIDxoMz4ke2FydGlzdC5uYW1lfTwvaDM+XG4gICAgICAgICAgICAgICAgPGkgY2xhc3M9XCJmYXMgZmEtY2hldnJvbi1kb3duXCI+PC9pPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX19tYXRjaFwiPlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkX19tYXRjaCBhcnRpc3RDYXJkX19tYXRjaC0tb3V0ZXJCYXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmRfX21hdGNoIGFydGlzdENhcmRfX21hdGNoLS1pbm5lckJhclwiIGRhdGEtcGVyY2VudE1hdGNoPVwiJHtwZXJjZW50TWF0Y2h9XCI+JHtwZXJjZW50TWF0Y2h9JTwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmQgYXJ0aXN0Q2FyZF9fZXhwYW5kXCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX190YWdzXCI+XG4gICAgICAgICAgICAgICAgPHVsPjwvdWw+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX3RyYWNrc1wiPlxuICAgICAgICAgICAgICAgIDx1bD48L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX19hbGJ1bXNcIj5cbiAgICAgICAgICAgICAgICA8dWw+PC91bD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgYClcbiAgICB9KTtcbiAgICAvLyBhZGQgdGFncyB0byBkb21cbiAgICBhcHAuYWRkUHJvcHNUb0RvbShhcnJheSwgXCJ0YWdzXCIpXG5cbiAgICAvLyBhZGQgdHJhY2tzIHRvIGRvbVxuICAgIGFwcC5hZGRQcm9wc1RvRG9tKGFycmF5LCBcInRyYWNrc1wiKVxuXG4gICAgLy8gYWRkIGFsYnVtcyB0byBkb21cbiAgICBhcHAuYWRkUHJvcHNUb0RvbShhcnJheSwgXCJhbGJ1bXNcIilcblxuICAgIC8vIG1ha2UgdGhlIG1hdGNoIHBlcmNlbnQgbWV0ZXIgcmVmbGVjdCB0aGUgbWF0Y2ggdmFsdWVcbiAgICBhcHAucGVyY2VudE1hdGNoKClcblxufVxuXG4vLyBGdW5jdGlvbiB0byBhZGQgcHJvcGVydHkgdG8gRE9NXG5hcHAuYWRkUHJvcHNUb0RvbSA9IChhcnJheSwgcHJvcCkgPT4ge1xuICAgIC8vIGZvciBlYWNoIGFydGlzdCBjYXJkIGJhbm5lci4uLndlIGRvIHRoZSBmb2xsb3dpbmc6XG4gICAgJChcIi5hcnRpc3RDYXJkX19iYW5uZXJcIikuZWFjaChmdW5jdGlvbigpe1xuICAgICAgICAvLyAgaXRlcmF0ZSB0aHJvdWdoIGV2ZXJ5IGFydGlzdCBpbiBvdXIgc2ltaWxhciBhcnRpc3RzIGFycmF5XG4gICAgICAgIGFycmF5LmZvckVhY2goKGFydGlzdCkgPT4ge1xuICAgICAgICAgICAgLy8gc2F2ZSB0aGUgZGl2J3MgYXJ0aXN0IGRhdGEgdGFnXG4gICAgICAgICAgICBjb25zdCBhcnRpc3REYXRhID0gJCh0aGlzKS5kYXRhKCdhcnRpc3QnKVxuICAgICAgICAgICAgLy8gaWYgdGhlIGFydGlzdCBkYXRhIHRhZyB0aGF0IHdlIGFyZSBjdXJyZW50eSBpdGVyYXRpbmcgdGhvdWdoIG1hdGNoZXMgdGhlIHNpbWlsYXIgYXJ0aXN0J3MgbmFtZSB0aGF0IHdlJ3JlIGl0ZXJhdGluZyB0aHJvdWdoIGZpbmQgdGhlIHVsIGl0IGJlbG9uZ3MgdG8gYW5kIGFwcGVuZCBpdHMgbmFtZSBhcyBhbiBsaVxuICAgICAgICAgICAgaWYgKGFydGlzdC5uYW1lID09PSBhcnRpc3REYXRhKSB7XG4gICAgICAgICAgICAgICAgYXJ0aXN0W3Byb3BdLmZvckVhY2goKGl0ZW0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYoaXRlbS5wbGF5Y291bnQgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLmZpbmQoYC5hcnRpc3RDYXJkX18ke3Byb3B9IHVsYCkuYXBwZW5kKGA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGg0PiR7aXRlbS5uYW1lfTwvaDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGg0PlRpbWVzIHBsYXllZDogJHtpdGVtLnBsYXljb3VudH08L2g0PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9saT5gKVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2V7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLmZpbmQoYC5hcnRpc3RDYXJkX18ke3Byb3B9IHVsYCkuYXBwZW5kKGA8bGk+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGg0PiR7aXRlbS5uYW1lfTwvaDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2xpPmApXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSlcbiAgICAkKFwiLmFydGlzdENhcmRfX2V4cGFuZFwiKS5oaWRlKCk7XG59XG5cblxuLy8gQSBmdW5jdGlvbiB0byBtYWtlIHRoZSBcIm1hdGNoIG1ldGVyXCIgbWF0Y2ggaXQncyB3aWR0aCAlIHRvIGl0J3MgZGF0YSgncGVyY2VudG1hdGNoJykgdmFsdWVcbmFwcC5wZXJjZW50TWF0Y2ggPSAoKSA9PiB7XG4gICAgJCgnLmFydGlzdENhcmRfX21hdGNoLS1pbm5lckJhcicpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBjb25zb2xlLmxvZygkKHRoaXMpKTtcbiAgICAgICAgY29uc3QgcGVyY2VudE1hdGNoID0gJCh0aGlzKS5kYXRhKCdwZXJjZW50bWF0Y2gnKVxuICAgICAgICAkKHRoaXMpLndpZHRoKGAwcHhgKVxuICAgICAgICAkKHRoaXMpLmFuaW1hdGUoeyB3aWR0aDogYCR7cGVyY2VudE1hdGNofSVgIH0sIDE1MDAsICdzd2luZycpXG5cbiAgICB9KTtcbiAgICBcbn07XG5cbmFwcC5zZXREZWZhdWx0U3RhdGUgPSAoKSA9PiB7XG4gICAgJCgnLmFydGlzdENhcmRfX2V4cGFuZCcpLmhpZGUoKTtcbn1cbiBcbmFwcC5ldmVudHMgPSAoKSA9PiB7XG4gICAgLy8gZSBldmVudHMgaGVyZS4gZm9ybSBzdWJtaXRzLCBjbGlja3MgZXRjLi4uXG4gICAgJCgnLnNlYXJjaEZvcm0nKS5vbignc3VibWl0JywgZnVuY3Rpb24oZSl7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYXBwLnNlYXJjaEFydGlzdCA9ICQodGhpcykuZmluZCgnLnNlYXJjaEZvcm1fX2lucHV0JykudmFsKCk7XG4gICAgICAgIGFwcC5nZXRTaW1pbGFyQXJ0aXN0cyhhcHAuc2VhcmNoQXJ0aXN0KTtcbiAgICAgICAgJChcIi5sb2FkaW5nT3ZlcmxheVwiKS5zaG93KFwiZmFkZVwiLCA1MDApXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGFwcC5zZWFyY2hBcnRpc3QpO1xuICAgIH0pXG5cbiAgICAkKCcuYXJ0aXN0Q2FyZENvbnRhaW5lcicpLm9uKCdjbGljaycsICcuYXJ0aXN0Q2FyZF9fYmFubmVyJywgZnVuY3Rpb24oKXtcbiAgICAgICAgY29uc3QgYXJ0aXN0ID0gJCh0aGlzKS5kYXRhKCdhcnRpc3QnKVxuICAgICAgICAkKHRoaXMpLnBhcmVudCgpLmZpbmQoXCIuYXJ0aXN0Q2FyZF9fZXhwYW5kXCIpLnRvZ2dsZShcInNsaWRlXCIse2RpcmVjdGlvbjogXCJ1cFwifSwgNTAwKTtcbiAgICB9KTtcblxuICAgIC8vICQoJy5zZWFyY2hGb3JtJykuZmluZCgnaW5wdXQnKVxuICAgICQoJy5zZWFyY2hGb3JtJykuZmluZCgnLnNlYXJjaEZvcm1fX2lucHV0Jykub24oJ2tleXVwJywgZnVuY3Rpb24oZSl7XG4gICAgICAgIGNvbnN0IGlucHV0VmFsID0gJCh0aGlzKS52YWwoKVxuICAgICAgICBpZihpbnB1dFZhbCAhPT0gXCJcIil7XG4gICAgICAgICAgICAkKHRoaXMpLnBhcmVudCgpLmZpbmQoJ2xhYmVsJykuY3NzKHtsZWZ0OiAnNyUnfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQodGhpcykucGFyZW50KCkuZmluZCgnbGFiZWwnKS5jc3MoeyBsZWZ0OiAnNTAlJywgdHJhbnNmb3JtOiAndHJhbnNsYXRlWCgtNTAlKSd9KVxuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vLyBJbml0aWFsaXplIGFwcFxuYXBwLmluaXQgPSAoKSA9PiB7XG4gICAgYXBwLmV2ZW50cygpXG5cbiAgICAkKFwiLmxvYWRpbmdPdmVybGF5XCIpLmhpZGUoXCJmYWRlXCIsIDUwMClcblxufVxuLy8gRnVuY3Rpb24gcmVhZHlcbiQoYXBwLmluaXQpXG5cblxuLy8gRFlOQU1JQyBNQVRDSCBTQ0FMRSAtIGZvciBzaW1pbGFyIGFydGlzdHMgZW5kIHBvaW50LCB0aGVyZSBpcyBhIG1hdGNoIHNjb3JlIHJlbGV0aXZlIHRvIHRoZSBzZWFyY2hlZCBhcnRpc3RzIDAtMVxuXG4vLyBvbiB1c2VyIGlucHV0IC0gZ2V0U2ltaWxhciJdfQ==
