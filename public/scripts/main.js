(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var ohHey = "Hello World";

var app = {};
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
    $.when(app.artistQuery(app.artistMethods.getSimilar, artist)).then(function (res) {
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
        app.getSimilarArtistTags(artistArr);
        // get top tracks for the similar artists, add tracks as property on artistsArr
        app.getSimilarArtistsTopTracks(artistArr);
        app.createArtistCard(artistArr);
        console.log(artistArr);
    });
};

app.getSimilarArtistTags = function (array) {
    array.forEach(function (item) {
        $.when(app.artistQuery(app.artistMethods.getTopTags, item.name)).then(function (res) {
            // create a variable for the tags array
            var tags = res.toptags.tag;

            // get the artist associated with each tags array
            var artist = app.getArtistFromRes(res.toptags);

            // filter the tags to those who are a match >= 10, then strip them to the essential info using map
            var tagArr = tags.filter(function (tag) {
                return tag.count >= 10;
            }).map(function (tag) {
                return {
                    name: tag.name,
                    count: tag.count
                };
            });

            // if the tag artist matches the initial array item's artist, add the tags as a property of that item
            if (artist === item.name) {
                item.tags = tagArr;
            }
        });
    });
    return array;
};

// take an array of all the similar artists
// iterate over each artist and submit an api request using $.when for .getTopTracks
app.getSimilarArtistsTopTracks = function (array) {
    array.forEach(function (item) {
        $.when(app.artistQuery(app.artistMethods.getTopTracks, item.name, 10)).then(function (res) {
            // console.log(res.toptracks);
            // create a variable for the tags array
            var tracks = res.toptracks.track;

            // get the artist associated with each tags array
            // const artist = res.toptracks['@attr'].artist
            var artist = app.getArtistFromRes(res.toptracks);

            // Map the array of tracks returned by the api to contain only the properties we want
            var tracksArr = tracks.map(function (song) {

                return {
                    track: song.name,
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

            // if the tag artist matches the initial array item's artist, add the tags as a property of that item
            if (artist === item.name) {
                item.tracks = tracksArr;
            }
        });
    });

    return array;
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

        $(artistCard).append('\n        <div class="artistCard__banner">\n            <div class="artistCard__name">\n                <h3>' + artist.name + '</h3>\n            </div>\n            <div class="artistCard__match">\n                <div class="artistCard__match artistCard__match--outerBar">\n                    <div class="artistCard__match artistCard__match--innerBar" data-percentMatch="' + percentMatch + '">' + percentMatch + '%</div>\n\t\t\t\t</div>\n\t\t\t</div>\n        </div>\n        <div class="artistCard__expand"></div>\n        ');
    });
    app.percentMatch();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsYUFBZDs7QUFFQSxJQUFNLE1BQU0sRUFBWjtBQUNBO0FBQ0EsSUFBSSxNQUFKOztBQUVBLElBQUksYUFBSixHQUFvQjtBQUNoQixZQUFRLFFBRFE7QUFFaEIsYUFBUyxTQUZPO0FBR2hCLGdCQUFZLFlBSEk7QUFJaEIsa0JBQWMsY0FKRTtBQUtoQixrQkFBYyxjQUxFO0FBTWhCLGdCQUFZOztBQUdoQjtBQUNBO0FBVm9CLENBQXBCLENBV0EsSUFBSSxXQUFKLEdBQWtCLFVBQUMsTUFBRCxFQUFTLE1BQVQsRUFBaUIsS0FBakIsRUFBMkI7QUFDekMsUUFBSSxTQUFKLHdEQUFtRSxNQUFuRTtBQUNBLFdBQU8sRUFBRSxJQUFGLENBQU87QUFDVixhQUFLLElBQUksU0FEQztBQUVWLGdCQUFRLEtBRkU7QUFHVixrQkFBVSxNQUhBO0FBSVYsY0FBTTtBQUNGLDBCQURFO0FBRUYscUJBQVMsSUFBSSxNQUZYO0FBR0Ysd0JBSEU7QUFJRixvQkFBUTtBQUpOO0FBSkksS0FBUCxDQUFQO0FBV0gsQ0FiRDs7QUFlQTtBQUNBO0FBQ0EsSUFBSSxpQkFBSixHQUF3QixVQUFDLE1BQUQsRUFBWTtBQUNoQyxNQUFFLElBQUYsQ0FBTyxJQUFJLFdBQUosQ0FBZ0IsSUFBSSxhQUFKLENBQWtCLFVBQWxDLEVBQThDLE1BQTlDLENBQVAsRUFDSyxJQURMLENBQ1UsVUFBQyxHQUFELEVBQVM7QUFDWCxZQUFNLFNBQVMsSUFBSSxjQUFKLENBQW1CLE1BQWxDO0FBQ0EsWUFBTSxZQUFZLE9BQ2IsTUFEYSxDQUNOLFVBQUMsTUFBRDtBQUFBLG1CQUFZLE9BQU8sS0FBUCxJQUFnQixHQUE1QjtBQUFBLFNBRE0sRUFFYixHQUZhLENBRVQsVUFBQyxNQUFELEVBQVk7QUFDYixtQkFBTztBQUNILHNC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QUFDQSxZQUFNLGVBQWUsS0FBSyxLQUFMLENBQVcsT0FBTyxPQUFPLEtBQWQsRUFBcUIsT0FBckIsQ0FBNkIsQ0FBN0IsSUFBa0MsR0FBN0MsQ0FBckI7QUFDQSxVQUFFLHNCQUFGLEVBQTBCLE1BQTFCLENBQWlDLFVBQWpDOztBQUVBLFVBQUUsVUFBRixFQUFjLE1BQWQsa0hBR2MsT0FBTyxJQUhyQiwrUEFPNEYsWUFQNUYsVUFPNkcsWUFQN0c7QUFhSCxLQXBCRDtBQXFCQSxRQUFJLFlBQUo7QUFDSCxDQXhCRDs7QUEwQkE7QUFDQSxJQUFJLFlBQUosR0FBbUIsWUFBTTtBQUNyQixNQUFFLDhCQUFGLEVBQWtDLElBQWxDLENBQXVDLFlBQVk7QUFDL0M7QUFDQSxZQUFNLGVBQWUsRUFBRSxJQUFGLEVBQVEsSUFBUixDQUFhLGNBQWIsQ0FBckI7QUFDQSxVQUFFLElBQUYsRUFBUSxLQUFSO0FBQ0EsVUFBRSxJQUFGLEVBQVEsT0FBUixDQUFnQixFQUFFLE9BQVUsWUFBVixNQUFGLEVBQWhCLEVBQStDLElBQS9DLEVBQXFELE9BQXJEO0FBRUgsS0FORDtBQVFILENBVEQ7O0FBV0EsSUFBSSxNQUFKLEdBQWEsWUFBTTtBQUNmO0FBQ0EsTUFBRSxhQUFGLEVBQWlCLEVBQWpCLENBQW9CLFFBQXBCLEVBQThCLFVBQVMsQ0FBVCxFQUFXO0FBQ3JDLFVBQUUsY0FBRjtBQUNBLFlBQUksWUFBSixHQUFtQixFQUFFLElBQUYsRUFBUSxJQUFSLENBQWEsb0JBQWIsRUFBbUMsR0FBbkMsRUFBbkI7QUFDQSxZQUFJLGlCQUFKLENBQXNCLElBQUksWUFBMUI7QUFDQTtBQUNILEtBTEQ7QUFNSCxDQVJEOztBQVdBO0FBQ0EsSUFBSSxJQUFKLEdBQVcsWUFBTTtBQUNiLFFBQUksTUFBSjtBQUlILENBTEQ7QUFNQTtBQUNBLEVBQUUsSUFBSSxJQUFOOztBQUdBOztBQUVBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3Qgb2hIZXkgPSBcIkhlbGxvIFdvcmxkXCI7XG5cbmNvbnN0IGFwcCA9IHt9O1xuLy8gTGFzdC5mbSBzaW1pbGFyIGFydGlzdCBhcGkgdXJsXG5hcHAuYXBpS2V5ID0gYGE1N2U4M2M0OTJiYzRhMGFjMzZmMThlNDdhYWFmOWI3YFxuXG5hcHAuYXJ0aXN0TWV0aG9kcyA9IHtcbiAgICBzZWFyY2g6ICdzZWFyY2gnLFxuICAgIGdldEluZm86ICdnZXRJbmZvJyxcbiAgICBnZXRTaW1pbGFyOiAnZ2V0U2ltaWxhcicsXG4gICAgZ2V0VG9wVHJhY2tzOiAnZ2V0VG9wVHJhY2tzJyxcbiAgICBnZXRUb3BBbGJ1bXM6ICdnZXRUb3BBbGJ1bXMnLFxuICAgIGdldFRvcFRhZ3M6ICdnZXRUb3BUYWdzJyxcbn1cblxuLy8gRnVuY3Rpb24gdG8gbWFrZSBhcGkgY2FsbHMgZm9yIGFydGlzdHNcbi8vIFBhcmFtIDEgLSB0aGUgdHlwZSBvZiBjYWxsIHlvdSB3YW50IHRvIG1ha2UgfCBQYXJhbSAyIC0gdGhlIGFydGlzdCB5b3UncmUgbWFraW5nIHRoZSBxdWVyeWluZyBmb3JcbmFwcC5hcnRpc3RRdWVyeSA9IChtZXRob2QsIGFydGlzdCwgbGltaXQpID0+IHtcbiAgICBhcHAuYXJ0aXN0VXJsID0gYGh0dHA6Ly93cy5hdWRpb3Njcm9iYmxlci5jb20vMi4wLz9tZXRob2Q9YXJ0aXN0LiR7bWV0aG9kfWBcbiAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgICAgdXJsOiBhcHAuYXJ0aXN0VXJsLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhcnRpc3QsXG4gICAgICAgICAgICBhcGlfa2V5OiBhcHAuYXBpS2V5LFxuICAgICAgICAgICAgbGltaXQsXG4gICAgICAgICAgICBmb3JtYXQ6ICdqc29uJyxcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG4vLyBcbi8vIGNyZWF0ZSBhIG5ldyBhcnJheSBvZiBzaW1pbGFyIGFydGlzdCBuYW1lcyB0aGF0IHdlIGNhbiBwYXNzIGFzIHRoZSBcImFydGlzdCB2YWx1ZSBmb3Igb3VyIG90aGVyIGFwaSBjYWxsc1xuYXBwLmdldFNpbWlsYXJBcnRpc3RzID0gKGFydGlzdCkgPT4ge1xuICAgICQud2hlbihhcHAuYXJ0aXN0UXVlcnkoYXBwLmFydGlzdE1ldGhvZHMuZ2V0U2ltaWxhciwgYXJ0aXN0KSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXJ0aXN0ID0gcmVzLnNpbWlsYXJhcnRpc3RzLmFydGlzdDtcbiAgICAgICAgICAgIGNvbnN0IGFydGlzdEFyciA9IGFydGlzdFxuICAgICAgICAgICAgICAgIC5maWx0ZXIoKGFydGlzdCkgPT4gYXJ0aXN0Lm1hdGNoID49IC4yNSlcbiAgICAgICAgICAgICAgICAubWFwKChhcnRpc3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGFydGlzdC5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2g6IGFydGlzdC5tYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gZ2V0IGdlbnJlIHRhZ3MgZm9yIHRoZSBzaW1pbGFyIGFydGlzdHMsIGFkZCB0YWdzIGFzIHByb3BlcnR5IG9uIGFydGlzdHNBcnJcbiAgICAgICAgICAgIGFwcC5nZXRTaW1pbGFyQXJ0aXN0VGFncyhhcnRpc3RBcnIpO1xuICAgICAgICAgICAgLy8gZ2V0IHRvcCB0cmFja3MgZm9yIHRoZSBzaW1pbGFyIGFydGlzdHMsIGFkZCB0cmFja3MgYXMgcHJvcGVydHkgb24gYXJ0aXN0c0FyclxuICAgICAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RzVG9wVHJhY2tzKGFydGlzdEFycik7XG4gICAgICAgICAgICBhcHAuY3JlYXRlQXJ0aXN0Q2FyZChhcnRpc3RBcnIpXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhcnRpc3RBcnIpXG4gICAgICAgIH0pXG59XG5cblxuYXBwLmdldFNpbWlsYXJBcnRpc3RUYWdzID0gKGFycmF5KSA9PiB7XG4gICAgYXJyYXkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAkLndoZW4oYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFRvcFRhZ3MsIGl0ZW0ubmFtZSkpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhIHZhcmlhYmxlIGZvciB0aGUgdGFncyBhcnJheVxuICAgICAgICAgICAgY29uc3QgdGFncyA9IHJlcy50b3B0YWdzLnRhZ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBnZXQgdGhlIGFydGlzdCBhc3NvY2lhdGVkIHdpdGggZWFjaCB0YWdzIGFycmF5XG4gICAgICAgICAgICBjb25zdCBhcnRpc3QgPSBhcHAuZ2V0QXJ0aXN0RnJvbVJlcyhyZXMudG9wdGFncylcblxuICAgICAgICAgICAgLy8gZmlsdGVyIHRoZSB0YWdzIHRvIHRob3NlIHdobyBhcmUgYSBtYXRjaCA+PSAxMCwgdGhlbiBzdHJpcCB0aGVtIHRvIHRoZSBlc3NlbnRpYWwgaW5mbyB1c2luZyBtYXBcbiAgICAgICAgICAgIGNvbnN0IHRhZ0FyciA9IHRhZ3NcbiAgICAgICAgICAgICAgICAuZmlsdGVyKCh0YWcpID0+IHRhZy5jb3VudCA+PSAxMClcbiAgICAgICAgICAgICAgICAubWFwKCh0YWcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRhZy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHRhZy5jb3VudFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gaWYgdGhlIHRhZyBhcnRpc3QgbWF0Y2hlcyB0aGUgaW5pdGlhbCBhcnJheSBpdGVtJ3MgYXJ0aXN0LCBhZGQgdGhlIHRhZ3MgYXMgYSBwcm9wZXJ0eSBvZiB0aGF0IGl0ZW1cbiAgICAgICAgICAgIGlmKGFydGlzdCA9PT0gaXRlbS5uYW1lKXtcbiAgICAgICAgICAgICAgICBpdGVtLnRhZ3MgPSB0YWdBcnJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KTtcbiAgICByZXR1cm4gYXJyYXlcbn1cblxuLy8gdGFrZSBhbiBhcnJheSBvZiBhbGwgdGhlIHNpbWlsYXIgYXJ0aXN0c1xuLy8gaXRlcmF0ZSBvdmVyIGVhY2ggYXJ0aXN0IGFuZCBzdWJtaXQgYW4gYXBpIHJlcXVlc3QgdXNpbmcgJC53aGVuIGZvciAuZ2V0VG9wVHJhY2tzXG5hcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BUcmFja3MgPSAoYXJyYXkpID0+IHtcbiAgICBhcnJheS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICQud2hlbihhcHAuYXJ0aXN0UXVlcnkoYXBwLmFydGlzdE1ldGhvZHMuZ2V0VG9wVHJhY2tzLCBpdGVtLm5hbWUsIDEwKSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocmVzLnRvcHRyYWNrcyk7XG4gICAgICAgICAgICAvLyBjcmVhdGUgYSB2YXJpYWJsZSBmb3IgdGhlIHRhZ3MgYXJyYXlcbiAgICAgICAgICAgIGNvbnN0IHRyYWNrcyA9IHJlcy50b3B0cmFja3MudHJhY2tcblxuICAgICAgICAgICAgLy8gZ2V0IHRoZSBhcnRpc3QgYXNzb2NpYXRlZCB3aXRoIGVhY2ggdGFncyBhcnJheVxuICAgICAgICAgICAgLy8gY29uc3QgYXJ0aXN0ID0gcmVzLnRvcHRyYWNrc1snQGF0dHInXS5hcnRpc3RcbiAgICAgICAgICAgIGNvbnN0IGFydGlzdCA9IGFwcC5nZXRBcnRpc3RGcm9tUmVzKHJlcy50b3B0cmFja3MpXG5cbiAgICAgICAgICAgIC8vIE1hcCB0aGUgYXJyYXkgb2YgdHJhY2tzIHJldHVybmVkIGJ5IHRoZSBhcGkgdG8gY29udGFpbiBvbmx5IHRoZSBwcm9wZXJ0aWVzIHdlIHdhbnRcbiAgICAgICAgICAgIGNvbnN0IHRyYWNrc0FyciA9IHRyYWNrc1xuICAgICAgICAgICAgICAgIC5tYXAoKHNvbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFjazogc29uZy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzOiBzb25nLmxpc3RlbmVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXljb3VudDogc29uZy5wbGF5Y291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkaWcgdGhyb3VnaCB0aGUgdGhlIGFycmF5IG9mIGltYWdlIG9iamVjdHMgdG8gcmV0dXJuIG9ubHkgdGhlIHVybCBvZiB0aGUgZXh0cmFsYXJnZSBzaXplZCBpbWFnZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogc29uZy5pbWFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChpbWcpID0+IGltZy5zaXplID09PSBcImV4dHJhbGFyZ2VcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoaW1nKSA9PiBpbWdbXCIjdGV4dFwiXSkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgdGFnIGFydGlzdCBtYXRjaGVzIHRoZSBpbml0aWFsIGFycmF5IGl0ZW0ncyBhcnRpc3QsIGFkZCB0aGUgdGFncyBhcyBhIHByb3BlcnR5IG9mIHRoYXQgaXRlbVxuICAgICAgICAgICAgaWYgKGFydGlzdCA9PT0gaXRlbS5uYW1lKSB7XG4gICAgICAgICAgICAgICAgaXRlbS50cmFja3MgPSB0cmFja3NBcnJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gYXJyYXlcbn1cblxuYXBwLmdldEFydGlzdEZyb21SZXMgPSAocm9vdE9iamVjdCkgPT4ge1xuICAgIHJldHVybiByb290T2JqZWN0WydAYXR0ciddLmFydGlzdFxufTtcblxuYXBwLmNyZWF0ZUFydGlzdENhcmQgPSAoYXJyYXkpID0+IHtcbiAgICAkKCcuYXJ0aXN0Q2FyZENvbnRhaW5lcicpLmVtcHR5KClcbiAgICBhcnJheS5mb3JFYWNoKChhcnRpc3QpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coTWF0aC5mbG9vcihOdW1iZXIoYXJ0aXN0Lm1hdGNoKS50b0ZpeGVkKDIpICogMTAwKS50b1N0cmluZygpKTtcblxuICAgICAgICBjb25zdCBhcnRpc3RDYXJkID0gJChcIjxzZWN0aW9uPlwiKS5hZGRDbGFzcygnYXJ0aXN0Q2FyZCcpXG4gICAgICAgIGNvbnN0IHBlcmNlbnRNYXRjaCA9IE1hdGguZmxvb3IoTnVtYmVyKGFydGlzdC5tYXRjaCkudG9GaXhlZCgyKSAqIDEwMClcbiAgICAgICAgJCgnLmFydGlzdENhcmRDb250YWluZXInKS5hcHBlbmQoYXJ0aXN0Q2FyZClcblxuICAgICAgICAkKGFydGlzdENhcmQpLmFwcGVuZChgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkX19iYW5uZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkX19uYW1lXCI+XG4gICAgICAgICAgICAgICAgPGgzPiR7YXJ0aXN0Lm5hbWV9PC9oMz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmRfX21hdGNoXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmRfX21hdGNoIGFydGlzdENhcmRfX21hdGNoLS1vdXRlckJhclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fbWF0Y2ggYXJ0aXN0Q2FyZF9fbWF0Y2gtLWlubmVyQmFyXCIgZGF0YS1wZXJjZW50TWF0Y2g9XCIke3BlcmNlbnRNYXRjaH1cIj4ke3BlcmNlbnRNYXRjaH0lPC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fZXhwYW5kXCI+PC9kaXY+XG4gICAgICAgIGApXG4gICAgfSk7XG4gICAgYXBwLnBlcmNlbnRNYXRjaCgpXG59XG5cbi8vIEEgZnVuY3Rpb24gdG8gbWFrZSB0aGUgXCJtYXRjaCBtZXRlclwiIG1hdGNoIGl0J3Mgd2lkdGggJSB0byBpdCdzIGRhdGEoJ3BlcmNlbnRtYXRjaCcpIHZhbHVlXG5hcHAucGVyY2VudE1hdGNoID0gKCkgPT4ge1xuICAgICQoJy5hcnRpc3RDYXJkX19tYXRjaC0taW5uZXJCYXInKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJCh0aGlzKSk7XG4gICAgICAgIGNvbnN0IHBlcmNlbnRNYXRjaCA9ICQodGhpcykuZGF0YSgncGVyY2VudG1hdGNoJylcbiAgICAgICAgJCh0aGlzKS53aWR0aChgMHB4YClcbiAgICAgICAgJCh0aGlzKS5hbmltYXRlKHsgd2lkdGg6IGAke3BlcmNlbnRNYXRjaH0lYCB9LCAxNTAwLCAnc3dpbmcnKVxuXG4gICAgfSk7XG4gICAgXG59O1xuXG5hcHAuZXZlbnRzID0gKCkgPT4ge1xuICAgIC8vIGUgZXZlbnRzIGhlcmUuIGZvcm0gc3VibWl0cywgY2xpY2tzIGV0Yy4uLlxuICAgICQoJy5zZWFyY2hGb3JtJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uKGUpe1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGFwcC5zZWFyY2hBcnRpc3QgPSAkKHRoaXMpLmZpbmQoJy5zZWFyY2hGb3JtX19pbnB1dCcpLnZhbCgpO1xuICAgICAgICBhcHAuZ2V0U2ltaWxhckFydGlzdHMoYXBwLnNlYXJjaEFydGlzdCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGFwcC5zZWFyY2hBcnRpc3QpO1xuICAgIH0pXG59O1xuXG5cbi8vIEluaXRpYWxpemUgYXBwXG5hcHAuaW5pdCA9ICgpID0+IHtcbiAgICBhcHAuZXZlbnRzKClcbiAgICBcbiAgICBcbiAgICBcbn1cbi8vIEZ1bmN0aW9uIHJlYWR5XG4kKGFwcC5pbml0KVxuXG5cbi8vIERZTkFNSUMgTUFUQ0ggU0NBTEUgLSBmb3Igc2ltaWxhciBhcnRpc3RzIGVuZCBwb2ludCwgdGhlcmUgaXMgYSBtYXRjaCBzY29yZSByZWxldGl2ZSB0byB0aGUgc2VhcmNoZWQgYXJ0aXN0cyAwLTFcblxuLy8gb24gdXNlciBpbnB1dCAtIGdldFNpbWlsYXIiXX0=
