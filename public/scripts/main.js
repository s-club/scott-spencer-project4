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
            return artist.match >= .30;
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

        $(artistCard).append('\n        <div class="artistCard artistCard__banner" data-artist="' + artist.name + '">\n            <div class="artistCard artistCard__name">\n                <h3>' + artist.name + '</h3>\n                <i class="fas fa-chevron-down"></i>\n            </div>\n            <div class="artistCard artistCard__match">\n                <div class="artistCard__match artistCard__match--outerBar">\n                    <div class="artistCard__match artistCard__match--innerBar" data-percentMatch="' + percentMatch + '">' + percentMatch + '%</div>\n\t\t\t\t</div>\n\t\t\t</div>\n        </div>\n        <div class="artistCard artistCard__expand">\n            <div class="artistCard artistCard__tags">\n                <ul></ul>\n            </div>\n            <div class="artistCard artistCard__tracks">\n                <h3>Top Tracks:</h3>\n                <ul></ul>\n            </div>\n            <div class="artistCard artistCard__albums">\n                <h3>Top Albums:</h3>\n                <ul></ul>\n            </div>\n        </div>\n        ');
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
        $(this).find('svg').toggleClass('bannerClick');
    });

    // $('.searchForm').find('input')
    $('.searchForm').find('.searchForm__input').on('keyup', function (e) {
        var inputVal = $(this).val();
        if (inputVal !== "") {
            $(this).parent().find('label').css({ top: '-50%' });
        } else {
            $(this).parent().find('label').css({ top: '0%' });
        }
    });
    $(window).on('unload', function () {
        $('.searchForm__input').val("");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsYUFBZDs7QUFFQSxJQUFNLE1BQU0sRUFBWjtBQUNBLE9BQU8sR0FBUCxHQUFhLEdBQWI7QUFDQTtBQUNBLElBQUksTUFBSjs7QUFFQSxJQUFJLGFBQUosR0FBb0I7QUFDaEIsWUFBUSxRQURRO0FBRWhCLGFBQVMsU0FGTztBQUdoQixnQkFBWSxZQUhJO0FBSWhCLGtCQUFjLGNBSkU7QUFLaEIsa0JBQWMsY0FMRTtBQU1oQixnQkFBWTs7QUFHaEI7QUFDQTtBQVZvQixDQUFwQixDQVdBLElBQUksV0FBSixHQUFrQixVQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLEtBQWpCLEVBQTJCO0FBQ3pDLFFBQUksU0FBSix3REFBbUUsTUFBbkU7QUFDQSxXQUFPLEVBQUUsSUFBRixDQUFPO0FBQ1YsYUFBSyxJQUFJLFNBREM7QUFFVixnQkFBUSxLQUZFO0FBR1Ysa0JBQVUsTUFIQTtBQUlWLGNBQU07QUFDRiwwQkFERTtBQUVGLHFCQUFTLElBQUksTUFGWDtBQUdGLHdCQUhFO0FBSUYsb0JBQVE7QUFKTjtBQUpJLEtBQVAsQ0FBUDtBQVdILENBYkQ7O0FBZUE7QUFDQTtBQUNBLElBQUksaUJBQUosR0FBd0IsVUFBQyxNQUFELEVBQVk7QUFDaEMsUUFBSSxXQUFKLENBQWdCLElBQUksYUFBSixDQUFrQixVQUFsQyxFQUE4QyxNQUE5QyxFQUNLLElBREwsQ0FDVSxVQUFDLEdBQUQsRUFBUztBQUNYLFlBQU0sU0FBUyxJQUFJLGNBQUosQ0FBbUIsTUFBbEM7QUFDQSxZQUFJLFlBQVksT0FDWCxNQURXLENBQ0osVUFBQyxNQUFEO0FBQUEsbUJBQVksT0FBTyxLQUFQLElBQWdCLEdBQTVCO0FBQUEsU0FESSxFQUVYLEdBRlcsQ0FFUCxVQUFDLE1BQUQsRUFBWTtBQUNiLG1CQUFPO0FB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QXFCLElBQXJCLENBQTBCLE1BQTFCLEVBQWtDLEdBQWxDO0FBRUgsQ0FMRDtBQU1BO0FBQ0EsRUFBRSxJQUFJLElBQU47O0FBR0E7O0FBRUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBvaEhleSA9IFwiSGVsbG8gV29ybGRcIjtcblxuY29uc3QgYXBwID0ge307XG53aW5kb3cuYXBwID0gYXBwO1xuLy8gTGFzdC5mbSBzaW1pbGFyIGFydGlzdCBhcGkgdXJsXG5hcHAuYXBpS2V5ID0gYGE1N2U4M2M0OTJiYzRhMGFjMzZmMThlNDdhYWFmOWI3YFxuXG5hcHAuYXJ0aXN0TWV0aG9kcyA9IHtcbiAgICBzZWFyY2g6ICdzZWFyY2gnLFxuICAgIGdldEluZm86ICdnZXRJbmZvJyxcbiAgICBnZXRTaW1pbGFyOiAnZ2V0U2ltaWxhcicsXG4gICAgZ2V0VG9wVHJhY2tzOiAnZ2V0VG9wVHJhY2tzJyxcbiAgICBnZXRUb3BBbGJ1bXM6ICdnZXRUb3BBbGJ1bXMnLFxuICAgIGdldFRvcFRhZ3M6ICdnZXRUb3BUYWdzJyxcbn1cblxuLy8gRnVuY3Rpb24gdG8gbWFrZSBhcGkgY2FsbHMgZm9yIGFydGlzdHNcbi8vIFBhcmFtIDEgLSB0aGUgdHlwZSBvZiBjYWxsIHlvdSB3YW50IHRvIG1ha2UgfCBQYXJhbSAyIC0gdGhlIGFydGlzdCB5b3UncmUgbWFraW5nIHRoZSBxdWVyeWluZyBmb3JcbmFwcC5hcnRpc3RRdWVyeSA9IChtZXRob2QsIGFydGlzdCwgbGltaXQpID0+IHtcbiAgICBhcHAuYXJ0aXN0VXJsID0gYGh0dHA6Ly93cy5hdWRpb3Njcm9iYmxlci5jb20vMi4wLz9tZXRob2Q9YXJ0aXN0LiR7bWV0aG9kfWBcbiAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgICAgdXJsOiBhcHAuYXJ0aXN0VXJsLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhcnRpc3QsXG4gICAgICAgICAgICBhcGlfa2V5OiBhcHAuYXBpS2V5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICBmb3JtYXQ6ICdqc29uJyxcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG4vLyBcbi8vIGNyZWF0ZSBhIG5ldyBhcnJheSBvZiBzaW1pbGFyIGFydGlzdCBuYW1lcyB0aGF0IHdlIGNhbiBwYXNzIGFzIHRoZSBcImFydGlzdCB2YWx1ZSBmb3Igb3VyIG90aGVyIGFwaSBjYWxsc1xuYXBwLmdldFNpbWlsYXJBcnRpc3RzID0gKGFydGlzdCkgPT4ge1xuICAgIGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRTaW1pbGFyLCBhcnRpc3QpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGFydGlzdCA9IHJlcy5zaW1pbGFyYXJ0aXN0cy5hcnRpc3Q7XG4gICAgICAgICAgICBsZXQgYXJ0aXN0QXJyID0gYXJ0aXN0XG4gICAgICAgICAgICAgICAgLmZpbHRlcigoYXJ0aXN0KSA9PiBhcnRpc3QubWF0Y2ggPj0gLjMwKVxuICAgICAgICAgICAgICAgIC5tYXAoKGFydGlzdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYXJ0aXN0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaDogYXJ0aXN0Lm1hdGNoLFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBnZXQgZ2VucmUgdGFncyBmb3IgdGhlIHNpbWlsYXIgYXJ0aXN0cywgYWRkIHRhZ3MgYXMgcHJvcGVydHkgb24gYXJ0aXN0c0FyclxuICAgICAgICAgICAgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgIGFwcC5nZXRTaW1pbGFyQXJ0aXN0VGFncyhhcnRpc3RBcnIpLFxuICAgICAgICAgICAgICAgIC8vIGdldCB0b3AgYWxidW1zIGZvciB0aGUgc2ltaWxhciBhcnRpc3RzIFxuICAgICAgICAgICAgICAgIGFwcC5nZXRTaW1pbGFyQXJ0aXN0c1RvcEFsYnVtcyhhcnRpc3RBcnIpLFxuICAgICAgICAgICAgICAgIC8vIGdldCB0b3AgdHJhY2tzIGZvciB0aGUgc2ltaWxhciBhcnRpc3RzLCBhZGQgdHJhY2tzIGFzIHByb3BlcnR5IG9uIGFydGlzdHNBcnJcbiAgICAgICAgICAgICAgICBhcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BUcmFja3MoYXJ0aXN0QXJyKV0pXG4gICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgIGFwcC5jcmVhdGVBcnRpc3RDYXJkKGFydGlzdEFycilcblxuICAgICAgICAgICAgICAgICAgICAkKFwiLmxvYWRpbmdPdmVybGF5XCIpLmhpZGUoXCJmYWRlXCIsIDUwMClcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coYXJ0aXN0QXJyKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxufVxuXG5hcHAuZ2V0U2ltaWxhckFydGlzdFRhZ3MgPSAoYXJyYXkpID0+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlcykgPT4ge1xuICAgICAgICBhcnJheSA9IGFycmF5Lm1hcCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRUb3BUYWdzLCBpdGVtLm5hbWUpXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAvLyBjcmVhdGUgYSB2YXJpYWJsZSBmb3IgdGhlIHRhZ3MgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFncyA9IHJlcy50b3B0YWdzLnRhZ1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGdldCB0aGUgYXJ0aXN0IGFzc29jaWF0ZWQgd2l0aCBlYWNoIHRhZ3MgYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXJ0aXN0ID0gYXBwLmdldEFydGlzdEZyb21SZXMocmVzLnRvcHRhZ3MpXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZmlsdGVyIHRoZSB0YWdzIHRvIHRob3NlIHdobyBhcmUgYSBtYXRjaCA+PSAxMCwgdGhlbiBzdHJpcCB0aGVtIHRvIHRoZSBlc3NlbnRpYWwgaW5mbyB1c2luZyBtYXBcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFnQXJyID0gdGFnc1xuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcigodGFnKSA9PiB0YWcuY291bnQgPj0gMjAgJiYgdGFnLm5hbWUgIT09IFwic2VlbiBsaXZlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKCh0YWcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0YWcubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsZXZhbmN5OiB0YWcuY291bnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmIHRoZSB0YWcgYXJ0aXN0IG1hdGNoZXMgdGhlIGluaXRpYWwgYXJyYXkgaXRlbSdzIGFydGlzdCwgYWRkIHRoZSB0YWdzIGFzIGEgcHJvcGVydHkgb2YgdGhhdCBpdGVtXG4gICAgICAgICAgICAgICAgICAgIGlmIChhcnRpc3QgPT09IGl0ZW0ubmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS50YWdzID0gdGFnQXJyXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBQcm9taXNlLmFsbChhcnJheSlcbiAgICAgICAgICAgIC50aGVuKHJlcyk7XG4gICAgfSk7XG59XG4vLyB0YWtlIGFuIGFycmF5IG9mIGFsbCB0aGUgc2ltaWxhciBhcnRpc3RzXG4vLyBpdGVyYXRlIG92ZXIgZWFjaCBhcnRpc3QgYW5kIHN1Ym1pdCBhbiBhcGkgcmVxdWVzdCB1c2luZyAkLndoZW4gZm9yIC5nZXRUb3BUcmFja3NcbmFwcC5nZXRTaW1pbGFyQXJ0aXN0c1RvcFRyYWNrcyA9IChhcnJheSkgPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzKSA9PiB7XG4gICAgICAgIGFycmF5ID0gYXJyYXkubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFRvcFRyYWNrcywgaXRlbS5uYW1lLCAxMClcbiAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhyZXMudG9wdHJhY2tzKTtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgYSB2YXJpYWJsZSBmb3IgdGhlIHRyYWNrcyBhcnJheVxuICAgICAgICAgICAgICAgIGNvbnN0IHRyYWNrcyA9IHJlcy50b3B0cmFja3MudHJhY2tcbiAgICBcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIGFydGlzdCBhc3NvY2lhdGVkIHdpdGggZWFjaCB0cmFja3MgYXJyYXlcbiAgICAgICAgICAgICAgICBjb25zdCBhcnRpc3QgPSBhcHAuZ2V0QXJ0aXN0RnJvbVJlcyhyZXMudG9wdHJhY2tzKVxuICAgIFxuICAgICAgICAgICAgICAgIC8vIE1hcCB0aGUgYXJyYXkgb2YgdHJhY2tzIHJldHVybmVkIGJ5IHRoZSBhcGkgdG8gY29udGFpbiBvbmx5IHRoZSBwcm9wZXJ0aWVzIHdlIHdhbnRcbiAgICAgICAgICAgICAgICBjb25zdCB0cmFja3NBcnIgPSB0cmFja3NcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoc29uZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHNvbmcubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnM6IHNvbmcubGlzdGVuZXJzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBsYXljb3VudDogc29uZy5wbGF5Y291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGlnIHRocm91Z2ggdGhlIHRoZSBhcnJheSBvZiBpbWFnZSBvYmplY3RzIHRvIHJldHVybiBvbmx5IHRoZSB1cmwgb2YgdGhlIGV4dHJhbGFyZ2Ugc2l6ZWQgaW1hZ2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiBzb25nLmltYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChpbWcpID0+IGltZy5zaXplID09PSBcImV4dHJhbGFyZ2VcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoKGltZykgPT4gaW1nW1wiI3RleHRcIl0pLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgIFxuICAgICAgICAgICAgICAgIC8vIGlmIHRoZSB0cmFjayBhcnRpc3QgbWF0Y2hlcyB0aGUgaW5pdGlhbCBhcnJheSBpdGVtJ3MgYXJ0aXN0LCBhZGQgdHJhY2tzIGFzIGEgcHJvcGVydHkgb2YgdGhhdCBpdGVtXG4gICAgICAgICAgICAgICAgaWYgKGFydGlzdCA9PT0gaXRlbS5uYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0udHJhY2tzID0gdHJhY2tzQXJyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBQcm9taXNlLmFsbChhcnJheSlcbiAgICAgICAgICAgIC50aGVuKHJlcyk7XG4gICAgfSk7XG59XG5cbmFwcC5nZXRTaW1pbGFyQXJ0aXN0c1RvcEFsYnVtcyA9IChhcnJheSkgPT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzKSA9PiB7XG4gICAgICAgIGFycmF5ID0gYXJyYXkubWFwKChpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFRvcEFsYnVtcywgaXRlbS5uYW1lLCA1KVxuICAgICAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFydGlzdCA9IGFwcC5nZXRBcnRpc3RGcm9tUmVzKHJlcy50b3BhbGJ1bXMpO1xuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGFydGlzdCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYWxidW1zID0gcmVzLnRvcGFsYnVtcy5hbGJ1bVxuICAgICAgICAgICAgICAgIC8vIE1hcCB0aGUgYXJyYXkgb2YgYWxidW1zIHJldHVybmVkIGJ5IHRoZSBBUEkgdG8gZGlzcGxheSBvbmx5IHRoZSBjb250ZW50IHdlIHdhbnRcbiAgICAgICAgICAgICAgICBjb25zdCBhbGJ1bUFyciA9IGFsYnVtcy5cbiAgICAgICAgICAgICAgICBtYXAoKGFsYnVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybntcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFsYnVtLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF5Y291bnQ6IGFsYnVtLnBsYXljb3VudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlOiBhbGJ1bS5pbWFnZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcigoaW1nKSA9PiBpbWcuc2l6ZSA9PT0gXCJleHRyYWxhcmdlXCIpLlxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwKChpbWcpID0+IGltZ1tcIiN0ZXh0XCJdKS50b1N0cmluZygpLFxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyBNYXAgaWYgYWxidW0gYXJ0aXN0IG1hdGNoZXMgdGhlIGluaXRpYWwgYXJyYXkgaXRlbXMgYXJ0aXN0XG4gICAgICAgICAgICAgICAgLy8gQWRkIHRoZSBhbGJ1bSBhcnJheSBhcyBhIHByb3BlcnR5IG9mIHRoYXQgaXRlbVxuICAgIFxuICAgICAgICAgICAgICAgIGlmKGFydGlzdCA9PT0gaXRlbS5uYW1lKXtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5hbGJ1bXMgPSBhbGJ1bUFycjtcbiAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJhcnRpc3RcIiwgYXJ0aXN0LCBcIkl0ZW06XCIsIGl0ZW0ubmFtZSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICAgIFByb21pc2UuYWxsKGFycmF5KVxuICAgICAgICAgICAgLnRoZW4ocmVzKTtcbiAgICB9KTtcbn1cblxuYXBwLmdldEFydGlzdEZyb21SZXMgPSAocm9vdE9iamVjdCkgPT4ge1xuICAgIHJldHVybiByb290T2JqZWN0WydAYXR0ciddLmFydGlzdFxufTtcblxuYXBwLmNyZWF0ZUFydGlzdENhcmQgPSAoYXJyYXkpID0+IHtcbiAgICAkKCcuYXJ0aXN0Q2FyZENvbnRhaW5lcicpLmVtcHR5KClcbiAgICBhcnJheS5mb3JFYWNoKChhcnRpc3QpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coTWF0aC5mbG9vcihOdW1iZXIoYXJ0aXN0Lm1hdGNoKS50b0ZpeGVkKDIpICogMTAwKS50b1N0cmluZygpKTtcblxuICAgICAgICBjb25zdCBhcnRpc3RDYXJkID0gJChcIjxzZWN0aW9uPlwiKS5hZGRDbGFzcygnYXJ0aXN0Q2FyZCcpXG4gICAgICAgIGNvbnN0IHBlcmNlbnRNYXRjaCA9IE1hdGguZmxvb3IoTnVtYmVyKGFydGlzdC5tYXRjaCkudG9GaXhlZCgyKSAqIDEwMClcbiAgICAgICAgJCgnLmFydGlzdENhcmRDb250YWluZXInKS5hcHBlbmQoYXJ0aXN0Q2FyZClcblxuICAgICAgICAkKGFydGlzdENhcmQpLmFwcGVuZChgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX2Jhbm5lclwiIGRhdGEtYXJ0aXN0PVwiJHthcnRpc3QubmFtZX1cIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX25hbWVcIj5cbiAgICAgICAgICAgICAgICA8aDM+JHthcnRpc3QubmFtZX08L2gzPlxuICAgICAgICAgICAgICAgIDxpIGNsYXNzPVwiZmFzIGZhLWNoZXZyb24tZG93blwiPjwvaT5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmQgYXJ0aXN0Q2FyZF9fbWF0Y2hcIj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fbWF0Y2ggYXJ0aXN0Q2FyZF9fbWF0Y2gtLW91dGVyQmFyXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkX19tYXRjaCBhcnRpc3RDYXJkX19tYXRjaC0taW5uZXJCYXJcIiBkYXRhLXBlcmNlbnRNYXRjaD1cIiR7cGVyY2VudE1hdGNofVwiPiR7cGVyY2VudE1hdGNofSU8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkIGFydGlzdENhcmRfX2V4cGFuZFwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmQgYXJ0aXN0Q2FyZF9fdGFnc1wiPlxuICAgICAgICAgICAgICAgIDx1bD48L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX190cmFja3NcIj5cbiAgICAgICAgICAgICAgICA8aDM+VG9wIFRyYWNrczo8L2gzPlxuICAgICAgICAgICAgICAgIDx1bD48L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZCBhcnRpc3RDYXJkX19hbGJ1bXNcIj5cbiAgICAgICAgICAgICAgICA8aDM+VG9wIEFsYnVtczo8L2gzPlxuICAgICAgICAgICAgICAgIDx1bD48L3VsPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICBgKVxuICAgIH0pO1xuICAgIC8vIGFkZCB0YWdzIHRvIGRvbVxuICAgIGFwcC5hZGRQcm9wc1RvRG9tKGFycmF5LCBcInRhZ3NcIilcblxuICAgIC8vIGFkZCB0cmFja3MgdG8gZG9tXG4gICAgYXBwLmFkZFByb3BzVG9Eb20oYXJyYXksIFwidHJhY2tzXCIpXG5cbiAgICAvLyBhZGQgYWxidW1zIHRvIGRvbVxuICAgIGFwcC5hZGRQcm9wc1RvRG9tKGFycmF5LCBcImFsYnVtc1wiKVxuXG4gICAgLy8gbWFrZSB0aGUgbWF0Y2ggcGVyY2VudCBtZXRlciByZWZsZWN0IHRoZSBtYXRjaCB2YWx1ZVxuICAgIGFwcC5wZXJjZW50TWF0Y2goKVxuXG59XG5cbi8vIEZ1bmN0aW9uIHRvIGFkZCBwcm9wZXJ0eSB0byBET01cbmFwcC5hZGRQcm9wc1RvRG9tID0gKGFycmF5LCBwcm9wKSA9PiB7XG4gICAgLy8gZm9yIGVhY2ggYXJ0aXN0IGNhcmQgYmFubmVyLi4ud2UgZG8gdGhlIGZvbGxvd2luZzpcbiAgICAkKFwiLmFydGlzdENhcmRfX2Jhbm5lclwiKS5lYWNoKGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vICBpdGVyYXRlIHRocm91Z2ggZXZlcnkgYXJ0aXN0IGluIG91ciBzaW1pbGFyIGFydGlzdHMgYXJyYXlcbiAgICAgICAgYXJyYXkuZm9yRWFjaCgoYXJ0aXN0KSA9PiB7XG4gICAgICAgICAgICAvLyBzYXZlIHRoZSBkaXYncyBhcnRpc3QgZGF0YSB0YWdcbiAgICAgICAgICAgIGNvbnN0IGFydGlzdERhdGEgPSAkKHRoaXMpLmRhdGEoJ2FydGlzdCcpXG4gICAgICAgICAgICAvLyBpZiB0aGUgYXJ0aXN0IGRhdGEgdGFnIHRoYXQgd2UgYXJlIGN1cnJlbnR5IGl0ZXJhdGluZyB0aG91Z2ggbWF0Y2hlcyB0aGUgc2ltaWxhciBhcnRpc3QncyBuYW1lIHRoYXQgd2UncmUgaXRlcmF0aW5nIHRocm91Z2ggZmluZCB0aGUgdWwgaXQgYmVsb25ncyB0byBhbmQgYXBwZW5kIGl0cyBuYW1lIGFzIGFuIGxpXG4gICAgICAgICAgICBpZiAoYXJ0aXN0Lm5hbWUgPT09IGFydGlzdERhdGEpIHtcbiAgICAgICAgICAgICAgICBhcnRpc3RbcHJvcF0uZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZihpdGVtLnBsYXljb3VudCAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkuZmluZChgLmFydGlzdENhcmRfXyR7cHJvcH0gdWxgKS5hcHBlbmQoYDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+JHtpdGVtLm5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+VGltZXMgcGxheWVkOiAke2l0ZW0ucGxheWNvdW50fTwvaDQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L2xpPmApXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZXtcbiAgICAgICAgICAgICAgICAgICAgICAgICQodGhpcykucGFyZW50KCkuZmluZChgLmFydGlzdENhcmRfXyR7cHJvcH0gdWxgKS5hcHBlbmQoYDxsaT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aDQ+JHtpdGVtLm5hbWV9PC9oND5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+YClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxuICAgICQoXCIuYXJ0aXN0Q2FyZF9fZXhwYW5kXCIpLmhpZGUoKTtcbn1cblxuXG4vLyBBIGZ1bmN0aW9uIHRvIG1ha2UgdGhlIFwibWF0Y2ggbWV0ZXJcIiBtYXRjaCBpdCdzIHdpZHRoICUgdG8gaXQncyBkYXRhKCdwZXJjZW50bWF0Y2gnKSB2YWx1ZVxuYXBwLnBlcmNlbnRNYXRjaCA9ICgpID0+IHtcbiAgICAkKCcuYXJ0aXN0Q2FyZF9fbWF0Y2gtLWlubmVyQmFyJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCQodGhpcykpO1xuICAgICAgICBjb25zdCBwZXJjZW50TWF0Y2ggPSAkKHRoaXMpLmRhdGEoJ3BlcmNlbnRtYXRjaCcpXG4gICAgICAgICQodGhpcykud2lkdGgoYDBweGApXG4gICAgICAgICQodGhpcykuYW5pbWF0ZSh7IHdpZHRoOiBgJHtwZXJjZW50TWF0Y2h9JWAgfSwgMTUwMCwgJ3N3aW5nJylcblxuICAgIH0pO1xuICAgIFxufTtcblxuYXBwLnNldERlZmF1bHRTdGF0ZSA9ICgpID0+IHtcbiAgICAkKCcuYXJ0aXN0Q2FyZF9fZXhwYW5kJykuaGlkZSgpO1xufVxuIFxuYXBwLmV2ZW50cyA9ICgpID0+IHtcbiAgICAvLyBlIGV2ZW50cyBoZXJlLiBmb3JtIHN1Ym1pdHMsIGNsaWNrcyBldGMuLi5cbiAgICAkKCcuc2VhcmNoRm9ybScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBhcHAuc2VhcmNoQXJ0aXN0ID0gJCh0aGlzKS5maW5kKCcuc2VhcmNoRm9ybV9faW5wdXQnKS52YWwoKTtcbiAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RzKGFwcC5zZWFyY2hBcnRpc3QpO1xuICAgICAgICAkKFwiLmxvYWRpbmdPdmVybGF5XCIpLnNob3coXCJmYWRlXCIsIDUwMClcbiAgICAgICAgLy8gY29uc29sZS5sb2coYXBwLnNlYXJjaEFydGlzdCk7XG4gICAgfSlcblxuICAgICQoJy5hcnRpc3RDYXJkQ29udGFpbmVyJykub24oJ2NsaWNrJywgJy5hcnRpc3RDYXJkX19iYW5uZXInLCBmdW5jdGlvbigpe1xuICAgICAgICBjb25zdCBhcnRpc3QgPSAkKHRoaXMpLmRhdGEoJ2FydGlzdCcpXG4gICAgICAgICQodGhpcykucGFyZW50KCkuZmluZChcIi5hcnRpc3RDYXJkX19leHBhbmRcIikudG9nZ2xlKFwic2xpZGVcIix7ZGlyZWN0aW9uOiBcInVwXCJ9LCA1MDApO1xuICAgICAgICAkKHRoaXMpLmZpbmQoJ3N2ZycpLnRvZ2dsZUNsYXNzKCdiYW5uZXJDbGljaycpXG4gICAgfSk7XG5cbiAgICAvLyAkKCcuc2VhcmNoRm9ybScpLmZpbmQoJ2lucHV0JylcbiAgICAkKCcuc2VhcmNoRm9ybScpLmZpbmQoJy5zZWFyY2hGb3JtX19pbnB1dCcpLm9uKCdrZXl1cCcsIGZ1bmN0aW9uKGUpe1xuICAgICAgICBjb25zdCBpbnB1dFZhbCA9ICQodGhpcykudmFsKClcbiAgICAgICAgaWYoaW5wdXRWYWwgIT09IFwiXCIpe1xuICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5maW5kKCdsYWJlbCcpLmNzcyh7dG9wOiAnLTUwJSd9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJCh0aGlzKS5wYXJlbnQoKS5maW5kKCdsYWJlbCcpLmNzcyh7dG9wOiAnMCUnfSlcbiAgICAgICAgfVxuICAgIH0pO1xuICAgICQod2luZG93KS5vbigndW5sb2FkJywgZnVuY3Rpb24oKXtcbiAgICAgICAgJCgnLnNlYXJjaEZvcm1fX2lucHV0JykudmFsKFwiXCIpXG4gICAgfSk7XG59O1xuXG4vLyBJbml0aWFsaXplIGFwcFxuYXBwLmluaXQgPSAoKSA9PiB7XG4gICAgYXBwLmV2ZW50cygpXG5cbiAgICAkKFwiLmxvYWRpbmdPdmVybGF5XCIpLmhpZGUoXCJmYWRlXCIsIDUwMClcblxufVxuLy8gRnVuY3Rpb24gcmVhZHlcbiQoYXBwLmluaXQpXG5cblxuLy8gRFlOQU1JQyBNQVRDSCBTQ0FMRSAtIGZvciBzaW1pbGFyIGFydGlzdHMgZW5kIHBvaW50LCB0aGVyZSBpcyBhIG1hdGNoIHNjb3JlIHJlbGV0aXZlIHRvIHRoZSBzZWFyY2hlZCBhcnRpc3RzIDAtMVxuXG4vLyBvbiB1c2VyIGlucHV0IC0gZ2V0U2ltaWxhciJdfQ==
