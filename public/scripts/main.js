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
        // get top albums for the similar artists 
        app.getSimilarArtistsTopAlbums(artistArr);
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

app.getSimilarArtistsTopAlbums = function (array) {
    array.forEach(function (item) {
        $.when(app.artistQuery(app.artistMethods.getTopAlbums, item.name, 5)).then(function (res) {
            var artist = app.getArtistFromRes(res.topalbums);
            // console.log(artist);
            var albums = res.topalbums.album;
            // Map the array of albums returned by the API to display only the content we want
            var albumArr = albums.map(function (album) {
                return {
                    album: album.name,
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsYUFBZDs7QUFFQSxJQUFNLE1BQU0sRUFBWjtBQUNBO0FBQ0EsSUFBSSxNQUFKOztBQUVBLElBQUksYUFBSixHQUFvQjtBQUNoQixZQUFRLFFBRFE7QUFFaEIsYUFBUyxTQUZPO0FBR2hCLGdCQUFZLFlBSEk7QUFJaEIsa0JBQWMsY0FKRTtBQUtoQixrQkFBYyxjQUxFO0FBTWhCLGdCQUFZOztBQUdoQjtBQUNBO0FBVm9CLENBQXBCLENBV0EsSUFBSSxXQUFKLEdBQWtCLFVBQUMsTUFBRCxFQUFTLE1BQVQsRUFBaUIsS0FBakIsRUFBMkI7QUFDekMsUUFBSSxTQUFKLHdEQUFtRSxNQUFuRTtBQUNBLFdBQU8sRUFBRSxJQUFGLENBQU87QUFDVixhQUFLLElBQUksU0FEQztBQUVWLGdCQUFRLEtBRkU7QUFHVixrQkFBVSxNQUhBO0FBSVYsY0FBTTtBQUNGLDBCQURFO0FBRUYscUJBQVMsSUFBSSxNQUZYO0FBR0Ysd0JBSEU7QUFJRixvQkFBUTtBQUpOO0FBSkksS0FBUCxDQUFQO0FBV0gsQ0FiRDs7QUFlQTtBQUNBO0FBQ0EsSUFBSSxpQkFBSixHQUF3QixVQUFDLE1BQUQsRUFBWTtBQUNoQyxNQUFFLElBQUYsQ0FBTyxJQUFJLFdBQUosQ0FBZ0IsSUFBSSxhQUFKLENBQWtCLFVBQWxDLEVBQThDLE1BQTlDLENBQVAsRUFDSyxJQURMLENBQ1UsVUFBQyxHQUFELEVBQVM7QUFDWCxZQUFNLFNBQVMsSUFBSSxjQUFKLENBQW1CLE1BQWxDO0FBQ0EsWUFBTSxZQUFZLE9BQ2IsTUFEYSxDQUNOLFVBQUMsTUFBRDtBQUFBLG1CQUFZLE9BQU8sS0FBUCxJQUFnQixHQUE1QjtBQUFBLFNBRE0sRUFFYixHQUZhLENBRVQsVUFBQyxNQUFELEVBQVk7QUFDYixtQkFBTztBQUNILHNC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TUFBZCxrSEFHYyxPQUFPLElBSHJCLCtQQU80RixZQVA1RixVQU82RyxZQVA3RztBQWFILEtBcEJEO0FBcUJBLFFBQUksWUFBSjtBQUNILENBeEJEOztBQTBCQTtBQUNBLElBQUksWUFBSixHQUFtQixZQUFNO0FBQ3JCLE1BQUUsOEJBQUYsRUFBa0MsSUFBbEMsQ0FBdUMsWUFBWTtBQUMvQztBQUNBLFlBQU0sZUFBZSxFQUFFLElBQUYsRUFBUSxJQUFSLENBQWEsY0FBYixDQUFyQjtBQUNBLFVBQUUsSUFBRixFQUFRLEtBQVI7QUFDQSxVQUFFLElBQUYsRUFBUSxPQUFSLENBQWdCLEVBQUUsT0FBVSxZQUFWLE1BQUYsRUFBaEIsRUFBK0MsSUFBL0MsRUFBcUQsT0FBckQ7QUFFSCxLQU5EO0FBUUgsQ0FURDs7QUFXQSxJQUFJLE1BQUosR0FBYSxZQUFNO0FBQ2Y7QUFDQSxNQUFFLGFBQUYsRUFBaUIsRUFBakIsQ0FBb0IsUUFBcEIsRUFBOEIsVUFBUyxDQUFULEVBQVc7QUFDckMsVUFBRSxjQUFGO0FBQ0EsWUFBSSxZQUFKLEdBQW1CLEVBQUUsSUFBRixFQUFRLElBQVIsQ0FBYSxvQkFBYixFQUFtQyxHQUFuQyxFQUFuQjtBQUNBLFlBQUksaUJBQUosQ0FBc0IsSUFBSSxZQUExQjtBQUNBO0FBQ0gsS0FMRDtBQU1ILENBUkQ7O0FBV0E7QUFDQSxJQUFJLElBQUosR0FBVyxZQUFNO0FBQ2IsUUFBSSxNQUFKO0FBSUgsQ0FMRDtBQU1BO0FBQ0EsRUFBRSxJQUFJLElBQU47O0FBR0E7O0FBRUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBvaEhleSA9IFwiSGVsbG8gV29ybGRcIjtcblxuY29uc3QgYXBwID0ge307XG4vLyBMYXN0LmZtIHNpbWlsYXIgYXJ0aXN0IGFwaSB1cmxcbmFwcC5hcGlLZXkgPSBgYTU3ZTgzYzQ5MmJjNGEwYWMzNmYxOGU0N2FhYWY5YjdgXG5cbmFwcC5hcnRpc3RNZXRob2RzID0ge1xuICAgIHNlYXJjaDogJ3NlYXJjaCcsXG4gICAgZ2V0SW5mbzogJ2dldEluZm8nLFxuICAgIGdldFNpbWlsYXI6ICdnZXRTaW1pbGFyJyxcbiAgICBnZXRUb3BUcmFja3M6ICdnZXRUb3BUcmFja3MnLFxuICAgIGdldFRvcEFsYnVtczogJ2dldFRvcEFsYnVtcycsXG4gICAgZ2V0VG9wVGFnczogJ2dldFRvcFRhZ3MnLFxufVxuXG4vLyBGdW5jdGlvbiB0byBtYWtlIGFwaSBjYWxscyBmb3IgYXJ0aXN0c1xuLy8gUGFyYW0gMSAtIHRoZSB0eXBlIG9mIGNhbGwgeW91IHdhbnQgdG8gbWFrZSB8IFBhcmFtIDIgLSB0aGUgYXJ0aXN0IHlvdSdyZSBtYWtpbmcgdGhlIHF1ZXJ5aW5nIGZvclxuYXBwLmFydGlzdFF1ZXJ5ID0gKG1ldGhvZCwgYXJ0aXN0LCBsaW1pdCkgPT4ge1xuICAgIGFwcC5hcnRpc3RVcmwgPSBgaHR0cDovL3dzLmF1ZGlvc2Nyb2JibGVyLmNvbS8yLjAvP21ldGhvZD1hcnRpc3QuJHttZXRob2R9YFxuICAgIHJldHVybiAkLmFqYXgoe1xuICAgICAgICB1cmw6IGFwcC5hcnRpc3RVcmwsXG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGFydGlzdCxcbiAgICAgICAgICAgIGFwaV9rZXk6IGFwcC5hcGlLZXksXG4gICAgICAgICAgICBsaW1pdCxcbiAgICAgICAgICAgIGZvcm1hdDogJ2pzb24nLFxuICAgICAgICB9XG4gICAgfSlcbn07XG5cbi8vIFxuLy8gY3JlYXRlIGEgbmV3IGFycmF5IG9mIHNpbWlsYXIgYXJ0aXN0IG5hbWVzIHRoYXQgd2UgY2FuIHBhc3MgYXMgdGhlIFwiYXJ0aXN0IHZhbHVlIGZvciBvdXIgb3RoZXIgYXBpIGNhbGxzXG5hcHAuZ2V0U2ltaWxhckFydGlzdHMgPSAoYXJ0aXN0KSA9PiB7XG4gICAgJC53aGVuKGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRTaW1pbGFyLCBhcnRpc3QpKVxuICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhcnRpc3QgPSByZXMuc2ltaWxhcmFydGlzdHMuYXJ0aXN0O1xuICAgICAgICAgICAgY29uc3QgYXJ0aXN0QXJyID0gYXJ0aXN0XG4gICAgICAgICAgICAgICAgLmZpbHRlcigoYXJ0aXN0KSA9PiBhcnRpc3QubWF0Y2ggPj0gLjI1KVxuICAgICAgICAgICAgICAgIC5tYXAoKGFydGlzdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYXJ0aXN0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaDogYXJ0aXN0Lm1hdGNoLFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBnZXQgZ2VucmUgdGFncyBmb3IgdGhlIHNpbWlsYXIgYXJ0aXN0cywgYWRkIHRhZ3MgYXMgcHJvcGVydHkgb24gYXJ0aXN0c0FyclxuICAgICAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RUYWdzKGFydGlzdEFycik7XG4gICAgICAgICAgICAvLyBnZXQgdG9wIGFsYnVtcyBmb3IgdGhlIHNpbWlsYXIgYXJ0aXN0cyBcbiAgICAgICAgICAgIGFwcC5nZXRTaW1pbGFyQXJ0aXN0c1RvcEFsYnVtcyhhcnRpc3RBcnIpO1xuICAgICAgICAgICAgLy8gZ2V0IHRvcCB0cmFja3MgZm9yIHRoZSBzaW1pbGFyIGFydGlzdHMsIGFkZCB0cmFja3MgYXMgcHJvcGVydHkgb24gYXJ0aXN0c0FyclxuICAgICAgICAgICAgYXBwLmdldFNpbWlsYXJBcnRpc3RzVG9wVHJhY2tzKGFydGlzdEFycik7XG4gICAgICAgICAgICBhcHAuY3JlYXRlQXJ0aXN0Q2FyZChhcnRpc3RBcnIpXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhhcnRpc3RBcnIpXG4gICAgICAgIH0pXG59XG5cblxuYXBwLmdldFNpbWlsYXJBcnRpc3RUYWdzID0gKGFycmF5KSA9PiB7XG4gICAgYXJyYXkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAkLndoZW4oYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFRvcFRhZ3MsIGl0ZW0ubmFtZSkpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhIHZhcmlhYmxlIGZvciB0aGUgdGFncyBhcnJheVxuICAgICAgICAgICAgY29uc3QgdGFncyA9IHJlcy50b3B0YWdzLnRhZ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBnZXQgdGhlIGFydGlzdCBhc3NvY2lhdGVkIHdpdGggZWFjaCB0YWdzIGFycmF5XG4gICAgICAgICAgICBjb25zdCBhcnRpc3QgPSBhcHAuZ2V0QXJ0aXN0RnJvbVJlcyhyZXMudG9wdGFncylcblxuICAgICAgICAgICAgLy8gZmlsdGVyIHRoZSB0YWdzIHRvIHRob3NlIHdobyBhcmUgYSBtYXRjaCA+PSAxMCwgdGhlbiBzdHJpcCB0aGVtIHRvIHRoZSBlc3NlbnRpYWwgaW5mbyB1c2luZyBtYXBcbiAgICAgICAgICAgIGNvbnN0IHRhZ0FyciA9IHRhZ3NcbiAgICAgICAgICAgICAgICAuZmlsdGVyKCh0YWcpID0+IHRhZy5jb3VudCA+PSAxMClcbiAgICAgICAgICAgICAgICAubWFwKCh0YWcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRhZy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHRhZy5jb3VudFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gaWYgdGhlIHRhZyBhcnRpc3QgbWF0Y2hlcyB0aGUgaW5pdGlhbCBhcnJheSBpdGVtJ3MgYXJ0aXN0LCBhZGQgdGhlIHRhZ3MgYXMgYSBwcm9wZXJ0eSBvZiB0aGF0IGl0ZW1cbiAgICAgICAgICAgIGlmKGFydGlzdCA9PT0gaXRlbS5uYW1lKXtcbiAgICAgICAgICAgICAgICBpdGVtLnRhZ3MgPSB0YWdBcnJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KTtcbiAgICByZXR1cm4gYXJyYXlcbn1cblxuLy8gdGFrZSBhbiBhcnJheSBvZiBhbGwgdGhlIHNpbWlsYXIgYXJ0aXN0c1xuLy8gaXRlcmF0ZSBvdmVyIGVhY2ggYXJ0aXN0IGFuZCBzdWJtaXQgYW4gYXBpIHJlcXVlc3QgdXNpbmcgJC53aGVuIGZvciAuZ2V0VG9wVHJhY2tzXG5hcHAuZ2V0U2ltaWxhckFydGlzdHNUb3BUcmFja3MgPSAoYXJyYXkpID0+IHtcbiAgICBhcnJheS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICQud2hlbihhcHAuYXJ0aXN0UXVlcnkoYXBwLmFydGlzdE1ldGhvZHMuZ2V0VG9wVHJhY2tzLCBpdGVtLm5hbWUsIDEwKSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocmVzLnRvcHRyYWNrcyk7XG4gICAgICAgICAgICAvLyBjcmVhdGUgYSB2YXJpYWJsZSBmb3IgdGhlIHRhZ3MgYXJyYXlcbiAgICAgICAgICAgIGNvbnN0IHRyYWNrcyA9IHJlcy50b3B0cmFja3MudHJhY2tcblxuICAgICAgICAgICAgLy8gZ2V0IHRoZSBhcnRpc3QgYXNzb2NpYXRlZCB3aXRoIGVhY2ggdGFncyBhcnJheVxuICAgICAgICAgICAgLy8gY29uc3QgYXJ0aXN0ID0gcmVzLnRvcHRyYWNrc1snQGF0dHInXS5hcnRpc3RcbiAgICAgICAgICAgIGNvbnN0IGFydGlzdCA9IGFwcC5nZXRBcnRpc3RGcm9tUmVzKHJlcy50b3B0cmFja3MpXG5cbiAgICAgICAgICAgIC8vIE1hcCB0aGUgYXJyYXkgb2YgdHJhY2tzIHJldHVybmVkIGJ5IHRoZSBhcGkgdG8gY29udGFpbiBvbmx5IHRoZSBwcm9wZXJ0aWVzIHdlIHdhbnRcbiAgICAgICAgICAgIGNvbnN0IHRyYWNrc0FyciA9IHRyYWNrc1xuICAgICAgICAgICAgICAgIC5tYXAoKHNvbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFjazogc29uZy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzOiBzb25nLmxpc3RlbmVycyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBsYXljb3VudDogc29uZy5wbGF5Y291bnQsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkaWcgdGhyb3VnaCB0aGUgdGhlIGFycmF5IG9mIGltYWdlIG9iamVjdHMgdG8gcmV0dXJuIG9ubHkgdGhlIHVybCBvZiB0aGUgZXh0cmFsYXJnZSBzaXplZCBpbWFnZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogc29uZy5pbWFnZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKChpbWcpID0+IGltZy5zaXplID09PSBcImV4dHJhbGFyZ2VcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoaW1nKSA9PiBpbWdbXCIjdGV4dFwiXSkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBpZiB0aGUgdGFnIGFydGlzdCBtYXRjaGVzIHRoZSBpbml0aWFsIGFycmF5IGl0ZW0ncyBhcnRpc3QsIGFkZCB0aGUgdGFncyBhcyBhIHByb3BlcnR5IG9mIHRoYXQgaXRlbVxuICAgICAgICAgICAgaWYgKGFydGlzdCA9PT0gaXRlbS5uYW1lKSB7XG4gICAgICAgICAgICAgICAgaXRlbS50cmFja3MgPSB0cmFja3NBcnJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gYXJyYXlcbn1cblxuYXBwLmdldFNpbWlsYXJBcnRpc3RzVG9wQWxidW1zID0gKGFycmF5KSA9PiB7XG4gICAgYXJyYXkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAkLndoZW4oYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFRvcEFsYnVtcywgaXRlbS5uYW1lLCA1KSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgYXJ0aXN0ID0gYXBwLmdldEFydGlzdEZyb21SZXMocmVzLnRvcGFsYnVtcyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhcnRpc3QpO1xuICAgICAgICAgICAgY29uc3QgYWxidW1zID0gcmVzLnRvcGFsYnVtcy5hbGJ1bVxuICAgICAgICAgICAgLy8gTWFwIHRoZSBhcnJheSBvZiBhbGJ1bXMgcmV0dXJuZWQgYnkgdGhlIEFQSSB0byBkaXNwbGF5IG9ubHkgdGhlIGNvbnRlbnQgd2Ugd2FudFxuICAgICAgICAgICAgY29uc3QgYWxidW1BcnIgPSBhbGJ1bXMuXG4gICAgICAgICAgICBtYXAoKGFsYnVtKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJue1xuICAgICAgICAgICAgICAgICAgICBhbGJ1bTogYWxidW0ubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgcGxheWNvdW50OiBhbGJ1bS5wbGF5Y291bnQsXG4gICAgICAgICAgICAgICAgICAgIGltYWdlOiBhbGJ1bS5pbWFnZS5cbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyKChpbWcpID0+IGltZy5zaXplID09PSBcImV4dHJhbGFyZ2VcIikuXG4gICAgICAgICAgICAgICAgICAgIG1hcCgoaW1nKSA9PiBpbWdbXCIjdGV4dFwiXSkudG9TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBNYXAgaWYgYWxidW0gYXJ0aXN0IG1hdGNoZXMgdGhlIGluaXRpYWwgYXJyYXkgaXRlbXMgYXJ0aXN0XG4gICAgICAgICAgICAvLyBBZGQgdGhlIGFsYnVtIGFycmF5IGFzIGEgcHJvcGVydHkgb2YgdGhhdCBpdGVtXG5cbiAgICAgICAgICAgIGlmKGFydGlzdCA9PT0gaXRlbS5uYW1lKXtcbiAgICAgICAgICAgICAgICBpdGVtLmFsYnVtcyA9IGFsYnVtQXJyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImFydGlzdFwiLCBhcnRpc3QsIFwiSXRlbTpcIiwgaXRlbS5uYW1lKVxuICAgICAgICB9KVxuICAgIH0pXG4gICAgcmV0dXJuIGFycmF5IFxufVxuXG5cblxuYXBwLmdldEFydGlzdEZyb21SZXMgPSAocm9vdE9iamVjdCkgPT4ge1xuICAgIHJldHVybiByb290T2JqZWN0WydAYXR0ciddLmFydGlzdFxufTtcblxuYXBwLmNyZWF0ZUFydGlzdENhcmQgPSAoYXJyYXkpID0+IHtcbiAgICAkKCcuYXJ0aXN0Q2FyZENvbnRhaW5lcicpLmVtcHR5KClcbiAgICBhcnJheS5mb3JFYWNoKChhcnRpc3QpID0+IHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coTWF0aC5mbG9vcihOdW1iZXIoYXJ0aXN0Lm1hdGNoKS50b0ZpeGVkKDIpICogMTAwKS50b1N0cmluZygpKTtcblxuICAgICAgICBjb25zdCBhcnRpc3RDYXJkID0gJChcIjxzZWN0aW9uPlwiKS5hZGRDbGFzcygnYXJ0aXN0Q2FyZCcpXG4gICAgICAgIGNvbnN0IHBlcmNlbnRNYXRjaCA9IE1hdGguZmxvb3IoTnVtYmVyKGFydGlzdC5tYXRjaCkudG9GaXhlZCgyKSAqIDEwMClcbiAgICAgICAgJCgnLmFydGlzdENhcmRDb250YWluZXInKS5hcHBlbmQoYXJ0aXN0Q2FyZClcblxuICAgICAgICAkKGFydGlzdENhcmQpLmFwcGVuZChgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkX19iYW5uZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkX19uYW1lXCI+XG4gICAgICAgICAgICAgICAgPGgzPiR7YXJ0aXN0Lm5hbWV9PC9oMz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmRfX21hdGNoXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmRfX21hdGNoIGFydGlzdENhcmRfX21hdGNoLS1vdXRlckJhclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fbWF0Y2ggYXJ0aXN0Q2FyZF9fbWF0Y2gtLWlubmVyQmFyXCIgZGF0YS1wZXJjZW50TWF0Y2g9XCIke3BlcmNlbnRNYXRjaH1cIj4ke3BlcmNlbnRNYXRjaH0lPC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fZXhwYW5kXCI+PC9kaXY+XG4gICAgICAgIGApXG4gICAgfSk7XG4gICAgYXBwLnBlcmNlbnRNYXRjaCgpXG59XG5cbi8vIEEgZnVuY3Rpb24gdG8gbWFrZSB0aGUgXCJtYXRjaCBtZXRlclwiIG1hdGNoIGl0J3Mgd2lkdGggJSB0byBpdCdzIGRhdGEoJ3BlcmNlbnRtYXRjaCcpIHZhbHVlXG5hcHAucGVyY2VudE1hdGNoID0gKCkgPT4ge1xuICAgICQoJy5hcnRpc3RDYXJkX19tYXRjaC0taW5uZXJCYXInKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gY29uc29sZS5sb2coJCh0aGlzKSk7XG4gICAgICAgIGNvbnN0IHBlcmNlbnRNYXRjaCA9ICQodGhpcykuZGF0YSgncGVyY2VudG1hdGNoJylcbiAgICAgICAgJCh0aGlzKS53aWR0aChgMHB4YClcbiAgICAgICAgJCh0aGlzKS5hbmltYXRlKHsgd2lkdGg6IGAke3BlcmNlbnRNYXRjaH0lYCB9LCAxNTAwLCAnc3dpbmcnKVxuXG4gICAgfSk7XG4gICAgXG59O1xuXG5hcHAuZXZlbnRzID0gKCkgPT4ge1xuICAgIC8vIGUgZXZlbnRzIGhlcmUuIGZvcm0gc3VibWl0cywgY2xpY2tzIGV0Yy4uLlxuICAgICQoJy5zZWFyY2hGb3JtJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uKGUpe1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGFwcC5zZWFyY2hBcnRpc3QgPSAkKHRoaXMpLmZpbmQoJy5zZWFyY2hGb3JtX19pbnB1dCcpLnZhbCgpO1xuICAgICAgICBhcHAuZ2V0U2ltaWxhckFydGlzdHMoYXBwLnNlYXJjaEFydGlzdCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGFwcC5zZWFyY2hBcnRpc3QpO1xuICAgIH0pXG59O1xuXG5cbi8vIEluaXRpYWxpemUgYXBwXG5hcHAuaW5pdCA9ICgpID0+IHtcbiAgICBhcHAuZXZlbnRzKClcbiAgICBcbiAgICBcbiAgICBcbn1cbi8vIEZ1bmN0aW9uIHJlYWR5XG4kKGFwcC5pbml0KVxuXG5cbi8vIERZTkFNSUMgTUFUQ0ggU0NBTEUgLSBmb3Igc2ltaWxhciBhcnRpc3RzIGVuZCBwb2ludCwgdGhlcmUgaXMgYSBtYXRjaCBzY29yZSByZWxldGl2ZSB0byB0aGUgc2VhcmNoZWQgYXJ0aXN0cyAwLTFcblxuLy8gb24gdXNlciBpbnB1dCAtIGdldFNpbWlsYXIiXX0=
