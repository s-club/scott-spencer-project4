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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsYUFBZDs7QUFFQSxJQUFNLE1BQU0sRUFBWjtBQUNBLE9BQU8sR0FBUCxHQUFhLEdBQWI7QUFDQTtBQUNBLElBQUksTUFBSjs7QUFFQSxJQUFJLGFBQUosR0FBb0I7QUFDaEIsWUFBUSxRQURRO0FBRWhCLGFBQVMsU0FGTztBQUdoQixnQkFBWSxZQUhJO0FBSWhCLGtCQUFjLGNBSkU7QUFLaEIsa0JBQWMsY0FMRTtBQU1oQixnQkFBWTs7QUFHaEI7QUFDQTtBQVZvQixDQUFwQixDQVdBLElBQUksV0FBSixHQUFrQixVQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLEtBQWpCLEVBQTJCO0FBQ3pDLFFBQUksU0FBSix3REFBbUUsTUFBbkU7QUFDQSxXQUFPLEVBQUUsSUFBRixDQUFPO0FBQ1YsYUFBSyxJQUFJLFNBREM7QUFFVixnQkFBUSxLQUZFO0FBR1Ysa0JBQVUsTUFIQTtBQUlWLGNBQU07QUFDRiwwQkFERTtBQUVGLHFCQUFTLElBQUksTUFGWDtBQUdGLHdCQUhFO0FBSUYsb0JBQVE7QUFKTjtBQUpJLEtBQVAsQ0FBUDtBQVdILENBYkQ7O0FBZUE7QUFDQTtBQUNBLElBQUksaUJBQUosR0FBd0IsVUFBQyxNQUFELEVBQVk7QUFDaEMsUUFBSSxXQUFKLENBQWdCLElBQUksYUFBSixDQUFrQixVQUFsQyxFQUE4QyxNQUE5QyxFQUNLLElBREwsQ0FDVSxVQUFDLEdBQUQsRUFBUztBQUNYLFlBQU0sU0FBUyxJQUFJLGNBQUosQ0FBbUIsTUFBbEM7QUFDQSxZQUFJLFlBQVksT0FDWCxNQURXLENBQ0osVUFBQyxNQUFEO0FBQUEsbUJBQVksT0FBTyxLQUFQLElBQWdCLEdBQTVCO0FBQUEsU0FESSxFQUVYLEdBRlcsQ0FFUCxVQUFDLE1BQUQsRUFBWTtBQUNiLG1CQUFPO0FB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SCxLQU5EOztBQVFBLE1BQUUsc0JBQUYsRUFBMEIsRUFBMUIsQ0FBNkIsT0FBN0IsRUFBc0MscUJBQXRDLEVBQTZELFlBQVU7QUFDbkUsZ0JBQVEsR0FBUixDQUFZLDRCQUFaO0FBQ0EsWUFBTSxTQUFTLEVBQUUsSUFBRixFQUFRLElBQVIsQ0FBYSxRQUFiLENBQWY7QUFDQSxVQUFFLElBQUYsRUFBUSxNQUFSLEdBQWlCLElBQWpCLENBQXNCLHFCQUF0QixFQUE2QyxNQUE3QyxDQUFvRCxPQUFwRCxFQUE2RCxFQUFDLFdBQVcsSUFBWixFQUE3RCxFQUErRSxHQUEvRTtBQUNBO0FBQ0gsS0FMRDtBQU1ILENBaEJEOztBQW1CQTtBQUNBLElBQUksSUFBSixHQUFXLFlBQU07QUFDYixRQUFJLE1BQUo7QUFDQSxNQUFFLGlCQUFGLEVBQXFCLElBQXJCLENBQTBCLE1BQTFCLEVBQWtDLEdBQWxDO0FBRUgsQ0FKRDtBQUtBO0FBQ0EsRUFBRSxJQUFJLElBQU47O0FBR0E7O0FBRUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBvaEhleSA9IFwiSGVsbG8gV29ybGRcIjtcblxuY29uc3QgYXBwID0ge307XG53aW5kb3cuYXBwID0gYXBwO1xuLy8gTGFzdC5mbSBzaW1pbGFyIGFydGlzdCBhcGkgdXJsXG5hcHAuYXBpS2V5ID0gYGE1N2U4M2M0OTJiYzRhMGFjMzZmMThlNDdhYWFmOWI3YFxuXG5hcHAuYXJ0aXN0TWV0aG9kcyA9IHtcbiAgICBzZWFyY2g6ICdzZWFyY2gnLFxuICAgIGdldEluZm86ICdnZXRJbmZvJyxcbiAgICBnZXRTaW1pbGFyOiAnZ2V0U2ltaWxhcicsXG4gICAgZ2V0VG9wVHJhY2tzOiAnZ2V0VG9wVHJhY2tzJyxcbiAgICBnZXRUb3BBbGJ1bXM6ICdnZXRUb3BBbGJ1bXMnLFxuICAgIGdldFRvcFRhZ3M6ICdnZXRUb3BUYWdzJyxcbn1cblxuLy8gRnVuY3Rpb24gdG8gbWFrZSBhcGkgY2FsbHMgZm9yIGFydGlzdHNcbi8vIFBhcmFtIDEgLSB0aGUgdHlwZSBvZiBjYWxsIHlvdSB3YW50IHRvIG1ha2UgfCBQYXJhbSAyIC0gdGhlIGFydGlzdCB5b3UncmUgbWFraW5nIHRoZSBxdWVyeWluZyBmb3JcbmFwcC5hcnRpc3RRdWVyeSA9IChtZXRob2QsIGFydGlzdCwgbGltaXQpID0+IHtcbiAgICBhcHAuYXJ0aXN0VXJsID0gYGh0dHA6Ly93cy5hdWRpb3Njcm9iYmxlci5jb20vMi4wLz9tZXRob2Q9YXJ0aXN0LiR7bWV0aG9kfWBcbiAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgICAgdXJsOiBhcHAuYXJ0aXN0VXJsLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhcnRpc3QsXG4gICAgICAgICAgICBhcGlfa2V5OiBhcHAuYXBpS2V5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICBmb3JtYXQ6ICdqc29uJyxcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG4vLyBcbi8vIGNyZWF0ZSBhIG5ldyBhcnJheSBvZiBzaW1pbGFyIGFydGlzdCBuYW1lcyB0aGF0IHdlIGNhbiBwYXNzIGFzIHRoZSBcImFydGlzdCB2YWx1ZSBmb3Igb3VyIG90aGVyIGFwaSBjYWxsc1xuYXBwLmdldFNpbWlsYXJBcnRpc3RzID0gKGFydGlzdCkgPT4ge1xuICAgIGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRTaW1pbGFyLCBhcnRpc3QpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFydGlzdCA9IHJlcy5zaW1pbGFyYXJ0aXN0cy5hcnRpc3Q7XG4gICAgICAgICAgICBsZXQgYXJ0aXN0QXJyID0gYXJ0aXN0XG4gICAgICAgICAgICAgICAgLmZpbHRlcigoYXJ0aXN0KSA9PiBhcnRpc3QubWF0Y2ggPj0gLjI1KVxuICAgICAgICAgICAgICAgIC5tYXAoKGFydGlzdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYXJ0aXN0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaDogYXJ0aXN0Lm1hdGNoLFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBnZXQgZ2VucmUgdGFncyBmb3IgdGhlIHNpbWlsYXIgYXJ0aXN0cywgYWRkIHRhZ3MgYXMgcHJvcGVydHkgb24gYXJ0aXN0c0FyclxuICAgICAgICAgICAgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgIGFwcC5nZXRTaW1pbGFyQXJ0aXN0VGFncyhhcnRpc3RBcnIpLFxuICAgICAgICAgICAgICAgIC8vIGdldCB0b3AgYWxidW1zIGZvciB0aGUgc2ltaWxhciBhcnRpc3RzIFxuICAgICAgICAgICAgICAgIGFwcC5nZXRTaW1pbGFyQXJ0aXN0c1RvcEFsYnVtcyhhcnRpc3RBcnIpLFxuICAgICAgICAgICAgICAgIC8vIGdldCB0b3AgdHJhY2tzIGZvciB0aGUgc2ltaWxhciBhcnRpc3RzLCBhZGQgdHJhY2tzIGFzIHByb3BlcnR5IG9uIGFydGlzdHNBcnJcbiAgICAgICAgICAgICAgICBhcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BUcmFja3MoYXJ0aXN0QXJyKV0pXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIGFwcC5jcmVhdGVBcnRpc3RDYXJkKGFydGlzdEFycilcbiAgICAgICAgICAgICAgICAgICAgJChcIi5sb2FkaW5nT3ZlcmxheVwiKS5oaWRlKFwiZmFkZVwiLCA1MDApXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGFydGlzdEFycilcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbn1cblxuYXBwLmdldFNpbWlsYXJBcnRpc3RUYWdzID0gKGFycmF5KSA9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXMpID0+IHtcbiAgICAgICAgYXJyYXkgPSBhcnJheS5tYXAoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBhcHAuYXJ0aXN0UXVlcnkoYXBwLmFydGlzdE1ldGhvZHMuZ2V0VG9wVGFncywgaXRlbS5uYW1lKVxuICAgICAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY3JlYXRlIGEgdmFyaWFibGUgZm9yIHRoZSB0YWdzIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhZ3MgPSByZXMudG9wdGFncy50YWdcblxuICAgICAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIGFydGlzdCBhc3NvY2lhdGVkIHdpdGggZWFjaCB0YWdzIGFycmF5XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFydGlzdCA9IGFwcC5nZXRBcnRpc3RGcm9tUmVzKHJlcy50b3B0YWdzKVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGZpbHRlciB0aGUgdGFncyB0byB0aG9zZSB3aG8gYXJlIGEgbWF0Y2ggPj0gMTAsIHRoZW4gc3RyaXAgdGhlbSB0byB0aGUgZXNzZW50aWFsIGluZm8gdXNpbmcgbWFwXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhZ0FyciA9IHRhZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoKHRhZykgPT4gdGFnLmNvdW50ID49IDIwICYmIHRhZy5uYW1lICE9PSBcInNlZW4gbGl2ZVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgodGFnKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGFnLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGV2YW5jeTogdGFnLmNvdW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgICAgICAvLyBpZiB0aGUgdGFnIGFydGlzdCBtYXRjaGVzIHRoZSBpbml0aWFsIGFycmF5IGl0ZW0ncyBhcnRpc3QsIGFkZCB0aGUgdGFncyBhcyBhIHByb3BlcnR5IG9mIHRoYXQgaXRlbVxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJ0aXN0ID09PSBpdGVtLm5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0udGFncyA9IHRhZ0FyclxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgUHJvbWlzZS5hbGwoYXJyYXkpXG4gICAgICAgICAgICAudGhlbihyZXMpO1xuICAgIH0pO1xufVxuLy8gdGFrZSBhbiBhcnJheSBvZiBhbGwgdGhlIHNpbWlsYXIgYXJ0aXN0c1xuLy8gaXRlcmF0ZSBvdmVyIGVhY2ggYXJ0aXN0IGFuZCBzdWJtaXQgYW4gYXBpIHJlcXVlc3QgdXNpbmcgJC53aGVuIGZvciAuZ2V0VG9wVHJhY2tzXG5hcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BUcmFja3MgPSAoYXJyYXkpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcykgPT4ge1xuICAgICAgICBhcnJheSA9IGFycmF5Lm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRUb3BUcmFja3MsIGl0ZW0ubmFtZSwgMTApXG4gICAgICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocmVzLnRvcHRyYWNrcyk7XG4gICAgICAgICAgICAgICAgLy8gY3JlYXRlIGEgdmFyaWFibGUgZm9yIHRoZSB0cmFja3MgYXJyYXlcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3MgPSByZXMudG9wdHJhY2tzLnRyYWNrXG4gICAgXG4gICAgICAgICAgICAgICAgLy8gZ2V0IHRoZSBhcnRpc3QgYXNzb2NpYXRlZCB3aXRoIGVhY2ggdHJhY2tzIGFycmF5XG4gICAgICAgICAgICAgICAgY29uc3QgYXJ0aXN0ID0gYXBwLmdldEFydGlzdEZyb21SZXMocmVzLnRvcHRyYWNrcylcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBNYXAgdGhlIGFycmF5IG9mIHRyYWNrcyByZXR1cm5lZCBieSB0aGUgYXBpIHRvIGNvbnRhaW4gb25seSB0aGUgcHJvcGVydGllcyB3ZSB3YW50XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhY2tzQXJyID0gdHJhY2tzXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoKHNvbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBzb25nLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzOiBzb25nLmxpc3RlbmVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGF5Y291bnQ6IHNvbmcucGxheWNvdW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRpZyB0aHJvdWdoIHRoZSB0aGUgYXJyYXkgb2YgaW1hZ2Ugb2JqZWN0cyB0byByZXR1cm4gb25seSB0aGUgdXJsIG9mIHRoZSBleHRyYWxhcmdlIHNpemVkIGltYWdlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltZzogc29uZy5pbWFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigoaW1nKSA9PiBpbWcuc2l6ZSA9PT0gXCJleHRyYWxhcmdlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKChpbWcpID0+IGltZ1tcIiN0ZXh0XCJdKS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBpZiB0aGUgdHJhY2sgYXJ0aXN0IG1hdGNoZXMgdGhlIGluaXRpYWwgYXJyYXkgaXRlbSdzIGFydGlzdCwgYWRkIHRyYWNrcyBhcyBhIHByb3BlcnR5IG9mIHRoYXQgaXRlbVxuICAgICAgICAgICAgICAgIGlmIChhcnRpc3QgPT09IGl0ZW0ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnRyYWNrcyA9IHRyYWNrc0FyclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgUHJvbWlzZS5hbGwoYXJyYXkpXG4gICAgICAgICAgICAudGhlbihyZXMpO1xuICAgIH0pO1xufVxuXG5hcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BBbGJ1bXMgPSAoYXJyYXkpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcykgPT4ge1xuICAgICAgICBhcnJheSA9IGFycmF5Lm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRUb3BBbGJ1bXMsIGl0ZW0ubmFtZSwgNSlcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBhcnRpc3QgPSBhcHAuZ2V0QXJ0aXN0RnJvbVJlcyhyZXMudG9wYWxidW1zKTtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhcnRpc3QpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsYnVtcyA9IHJlcy50b3BhbGJ1bXMuYWxidW1cbiAgICAgICAgICAgICAgICAvLyBNYXAgdGhlIGFycmF5IG9mIGFsYnVtcyByZXR1cm5lZCBieSB0aGUgQVBJIHRvIGRpc3BsYXkgb25seSB0aGUgY29udGVudCB3ZSB3YW50XG4gICAgICAgICAgICAgICAgY29uc3QgYWxidW1BcnIgPSBhbGJ1bXMuXG4gICAgICAgICAgICAgICAgbWFwKChhbGJ1bSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm57XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBhbGJ1bS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGxheWNvdW50OiBhbGJ1bS5wbGF5Y291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZTogYWxidW0uaW1hZ2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIoKGltZykgPT4gaW1nLnNpemUgPT09IFwiZXh0cmFsYXJnZVwiKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcCgoaW1nKSA9PiBpbWdbXCIjdGV4dFwiXSkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgLy8gTWFwIGlmIGFsYnVtIGFydGlzdCBtYXRjaGVzIHRoZSBpbml0aWFsIGFycmF5IGl0ZW1zIGFydGlzdFxuICAgICAgICAgICAgICAgIC8vIEFkZCB0aGUgYWxidW0gYXJyYXkgYXMgYSBwcm9wZXJ0eSBvZiB0aGF0IGl0ZW1cbiAgICBcbiAgICAgICAgICAgICAgICBpZihhcnRpc3QgPT09IGl0ZW0ubmFtZSl7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uYWxidW1zID0gYWxidW1BcnI7XG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiYXJ0aXN0XCIsIGFydGlzdCwgXCJJdGVtOlwiLCBpdGVtLm5hbWUpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICBQcm9taXNlLmFsbChhcnJheSlcbiAgICAgICAgICAgIC50aGVuKHJlcyk7XG4gICAgfSk7XG59XG5cbmFwcC5nZXRBcnRpc3RGcm9tUmVzID0gKHJvb3RPYmplY3QpID0+IHtcbiAgICByZXR1cm4gcm9vdE9iamVjdFsnQGF0dHInXS5hcnRpc3Rcbn07XG5cbmFwcC5jcmVhdGVBcnRpc3RDYXJkID0gKGFycmF5KSA9PiB7XG4gICAgJCgnLmFydGlzdENhcmRDb250YWluZXInKS5lbXB0eSgpXG4gICAgYXJyYXkuZm9yRWFjaCgoYXJ0aXN0KSA9PiB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKE1hdGguZmxvb3IoTnVtYmVyKGFydGlzdC5tYXRjaCkudG9GaXhlZCgyKSAqIDEwMCkudG9TdHJpbmcoKSk7XG5cbiAgICAgICAgY29uc3QgYXJ0aXN0Q2FyZCA9ICQoXCI8c2VjdGlvbj5cIikuYWRkQ2xhc3MoJ2FydGlzdENhcmQnKVxuICAgICAgICBjb25zdCBwZXJjZW50TWF0Y2ggPSBNYXRoLmZsb29yKE51bWJlcihhcnRpc3QubWF0Y2gpLnRvRml4ZWQoMikgKiAxMDApXG4gICAgICAgICQoJy5hcnRpc3RDYXJkQ29udGFpbmVyJykuYXBwZW5kKGFydGlzdENhcmQpXG5cbiAgICAgICAgJChhcnRpc3RDYXJkKS5hcHBlbmQoYFxuICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX19iYW5uZXJcIiBkYXRhLWFydGlzdD1cIiR7YXJ0aXN0Lm5hbWV9XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fbmFtZVwiPlxuICAgICAgICAgICAgICAgIDxoMz4ke2FydGlzdC5uYW1lfTwvaDM+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX21hdGNoXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmRfX21hdGNoIGFydGlzdENhcmRfX21hdGNoLS1vdXRlckJhclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fbWF0Y2ggYXJ0aXN0Q2FyZF9fbWF0Y2gtLWlubmVyQmFyXCIgZGF0YS1wZXJjZW50TWF0Y2g9XCIke3BlcmNlbnRNYXRjaH1cIj4ke3BlcmNlbnRNYXRjaH0lPC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX19leHBhbmRcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX3RhZ3NcIj5cbiAgICAgICAgICAgICAgICA8dWw+PC91bD5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmQgYXJ0aXN0Q2FyZF9fdHJhY2tzXCI+XG4gICAgICAgICAgICAgICAgPHVsPjwvdWw+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX2FsYnVtc1wiPlxuICAgICAgICAgICAgICAgIDx1bD48L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBgKVxuICAgIH0pO1xuICAgIC8vIGFkZCB0YWdzIHRvIGRvbVxuICAgIGFwcC5hZGRQcm9wc1RvRG9tKGFycmF5LCBcInRhZ3NcIilcblxuICAgIC8vIGFkZCB0cmFja3MgdG8gZG9tXG4gICAgYXBwLmFkZFByb3BzVG9Eb20oYXJyYXksIFwidHJhY2tzXCIpXG5cbiAgICAvLyBhZGQgYWxidW1zIHRvIGRvbVxuICAgIGFwcC5hZGRQcm9wc1RvRG9tKGFycmF5LCBcImFsYnVtc1wiKVxuXG4gICAgLy8gbWFrZSB0aGUgbWF0Y2ggcGVyY2VudCBtZXRlciByZWZsZWN0IHRoZSBtYXRjaCB2YWx1ZVxuICAgIGFwcC5wZXJjZW50TWF0Y2goKVxuXG59XG5cbi8vIEZ1bmN0aW9uIHRvIGFkZCBwcm9wZXJ0eSB0byBET01cbmFwcC5hZGRQcm9wc1RvRG9tID0gKGFycmF5LCBwcm9wKSA9PiB7XG4gICAgLy8gZm9yIGVhY2ggYXJ0aXN0IGNhcmQgYmFubmVyLi4ud2UgZG8gdGhlIGZvbGxvd2luZzpcbiAgICAkKFwiLmFydGlzdENhcmRfX2Jhbm5lclwiKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vICBpdGVyYXRlIHRocm91Z2ggZXZlcnkgYXJ0aXN0IGluIG91ciBzaW1pbGFyIGFydGlzdHMgYXJyYXlcbiAgICAgICAgYXJyYXkuZm9yRWFjaCgoYXJ0aXN0KSA9PiB7XG4gICAgICAgICAgICAvLyBzYXZlIHRoZSBkaXYncyBhcnRpc3QgZGF0YSB0YWdcbiAgICAgICAgICAgIGNvbnN0IGFydGlzdERhdGEgPSAkKHRoaXMpLmRhdGEoJ2FydGlzdCcpXG4gICAgICAgICAgICAvLyBpZiB0aGUgYXJ0aXN0IGRhdGEgdGFnIHRoYXQgd2UgYXJlIGN1cnJlbnR5IGl0ZXJhdGluZyB0aG91Z2ggbWF0Y2hlcyB0aGUgc2ltaWxhciBhcnRpc3QncyBuYW1lIHRoYXQgd2UncmUgaXRlcmF0aW5nIHRocm91Z2ggZmluZCB0aGUgdWwgaXQgYmVsb25ncyB0byBhbmQgYXBwZW5kIGl0cyBuYW1lIGFzIGFuIGxpXG4gICAgICAgICAgICBpZiAoYXJ0aXN0Lm5hbWUgPT09IGFydGlzdERhdGEpIHtcbiAgICAgICAgICAgICAgICBhcnRpc3RbcHJvcF0uZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZihpdGVtLnBsYXljb3VudCAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkuZmluZChgLmFydGlzdENhcmRfXyR7cHJvcH0gdWxgKS5hcHBlbmQoYDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+JHtpdGVtLm5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+VGltZXMgcGxheWVkOiAke2l0ZW0ucGxheWNvdW50fTwvaDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2xpPmApXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkuZmluZChgLmFydGlzdENhcmRfXyR7cHJvcH0gdWxgKS5hcHBlbmQoYDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+JHtpdGVtLm5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+YClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxuICAgICQoXCIuYXJ0aXN0Q2FyZF9fZXhwYW5kXCIpLmhpZGUoNTAwKVxufVxuXG4vLyBBIGZ1bmN0aW9uIHRvIG1ha2UgdGhlIFwibWF0Y2ggbWV0ZXJcIiBtYXRjaCBpdCdzIHdpZHRoICUgdG8gaXQncyBkYXRhKCdwZXJjZW50bWF0Y2gnKSB2YWx1ZVxuYXBwLnBlcmNlbnRNYXRjaCA9ICgpID0+IHtcbiAgICAkKCcuYXJ0aXN0Q2FyZF9fbWF0Y2gtLWlubmVyQmFyJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCQodGhpcykpO1xuICAgICAgICBjb25zdCBwZXJjZW50TWF0Y2ggPSAkKHRoaXMpLmRhdGEoJ3BlcmNlbnRtYXRjaCcpXG4gICAgICAgICQodGhpcykud2lkdGgoYDBweGApXG4gICAgICAgICQodGhpcykuYW5pbWF0ZSh7IHdpZHRoOiBgJHtwZXJjZW50TWF0Y2h9JWAgfSwgMTUwMCwgJ3N3aW5nJylcblxuICAgIH0pO1xuICAgIFxufTtcblxuYXBwLmV2ZW50cyA9ICgpID0+IHtcbiAgICAvLyBlIGV2ZW50cyBoZXJlLiBmb3JtIHN1Ym1pdHMsIGNsaWNrcyBldGMuLi5cbiAgICAkKCcuc2VhcmNoRm9ybScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBhcHAuc2VhcmNoQXJ0aXN0ID0gJCh0aGlzKS5maW5kKCcuc2VhcmNoRm9ybV9faW5wdXQnKS52YWwoKTtcbiAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RzKGFwcC5zZWFyY2hBcnRpc3QpO1xuICAgICAgICAkKFwiLmxvYWRpbmdPdmVybGF5XCIpLnNob3coXCJmYWRlXCIsIDUwMClcbiAgICAgICAgLy8gY29uc29sZS5sb2coYXBwLnNlYXJjaEFydGlzdCk7XG4gICAgfSlcblxuICAgICQoJy5hcnRpc3RDYXJkQ29udGFpbmVyJykub24oJ2NsaWNrJywgJy5hcnRpc3RDYXJkX19iYW5uZXInLCBmdW5jdGlvbigpe1xuICAgICAgICBjb25zb2xlLmxvZygnQVJUSVNUIENBUkQgQkFOTkVSIENMSUNLRUQnKVxuICAgICAgICBjb25zdCBhcnRpc3QgPSAkKHRoaXMpLmRhdGEoJ2FydGlzdCcpXG4gICAgICAgICQodGhpcykucGFyZW50KCkuZmluZChcIi5hcnRpc3RDYXJkX19leHBhbmRcIikudG9nZ2xlKFwic2xpZGVcIiwge2RpcmVjdGlvbjogXCJ1cFwifSw1MDApXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGFydGlzdClcbiAgICB9KTtcbn07XG5cblxuLy8gSW5pdGlhbGl6ZSBhcHBcbmFwcC5pbml0ID0gKCkgPT4ge1xuICAgIGFwcC5ldmVudHMoKVxuICAgICQoXCIubG9hZGluZ092ZXJsYXlcIikuaGlkZShcImZhZGVcIiwgNTAwKVxuXG59XG4vLyBGdW5jdGlvbiByZWFkeVxuJChhcHAuaW5pdClcblxuXG4vLyBEWU5BTUlDIE1BVENIIFNDQUxFIC0gZm9yIHNpbWlsYXIgYXJ0aXN0cyBlbmQgcG9pbnQsIHRoZXJlIGlzIGEgbWF0Y2ggc2NvcmUgcmVsZXRpdmUgdG8gdGhlIHNlYXJjaGVkIGFydGlzdHMgMC0xXG5cbi8vIG9uIHVzZXIgaW5wdXQgLSBnZXRTaW1pbGFyIl19
