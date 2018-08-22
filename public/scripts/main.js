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
};app.artistQuery = function (method, artist) {
    app.artistUrl = 'http://ws.audioscrobbler.com/2.0/?method=artist.' + method;
    return $.ajax({
        url: app.artistUrl,
        method: 'GET',
        dataType: 'json',
        data: {
            artist: artist,
            api_key: app.apiKey,
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
        app.getSimilarArtistTags(artistArr);
        app.createArtistCard(artistArr);
        // console.log(artistArr)
    });
};

app.getSimilarArtistTags = function (array) {
    array.forEach(function (item) {
        $.when(app.artistQuery(app.artistMethods.getTopTags, item.name)).then(function (res) {
            // create a variable for the tags array
            var tags = res.toptags.tag;

            // get the artist associated with each tags array
            var artist = res.toptags['@attr'].artist;

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

app.createArtistCard = function (array) {
    array.forEach(function (artist) {
        console.log(Math.floor(Number(artist.match).toFixed(2) * 180));

        var artistCard = $("<section>").addClass('artistCard');
        var percentMatch = Math.floor(Number(artist.match).toFixed(2) * 100);

        $('main').append(artistCard);

        $(artistCard).append('\n        <div class="artistCard__banner">\n            <div class="artistCard__name">\n                <h3>' + artist.name + '</h3>\n            </div>\n            <div class="artistCard__match">\n                <div class="artistCard__match artistCard__match--outerBar">\n                    <div class="artistCard__match artistCard__match--innerBar">' + percentMatch + '%</div>\n\t\t\t\t</div>\n\t\t\t</div>\n        </div>\n        <div class="artistCard__expand"></div>\n        ');
    });
    $('.artistCard__match--innerBar').css({ width: "50%" });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsYUFBZDs7QUFFQSxJQUFNLE1BQU0sRUFBWjtBQUNBO0FBQ0EsSUFBSSxNQUFKOztBQUVBLElBQUksYUFBSixHQUFvQjtBQUNoQixZQUFRLFFBRFE7QUFFaEIsYUFBUyxTQUZPO0FBR2hCLGdCQUFZLFlBSEk7QUFJaEIsa0JBQWMsY0FKRTtBQUtoQixrQkFBYyxjQUxFO0FBTWhCLGdCQUFZOztBQUdoQjtBQUNBO0FBVm9CLENBQXBCLENBV0EsSUFBSSxXQUFKLEdBQWtCLFVBQUMsTUFBRCxFQUFTLE1BQVQsRUFBb0I7QUFDbEMsUUFBSSxTQUFKLHdEQUFtRSxNQUFuRTtBQUNBLFdBQU8sRUFBRSxJQUFGLENBQU87QUFDVixhQUFLLElBQUksU0FEQztBQUVWLGdCQUFRLEtBRkU7QUFHVixrQkFBVSxNQUhBO0FBSVYsY0FBTTtBQUNGLDBCQURFO0FBRUYscUJBQVMsSUFBSSxNQUZYO0FBR0Ysb0JBQVE7QUFITjtBQUpJLEtBQVAsQ0FBUDtBQVVILENBWkQ7O0FBY0E7QUFDQTtBQUNBLElBQUksaUJBQUosR0FBd0IsVUFBQyxNQUFELEVBQVk7QUFDaEMsTUFBRSxJQUFGLENBQU8sSUFBSSxXQUFKLENBQWdCLElBQUksYUFBSixDQUFrQixVQUFsQyxFQUE4QyxNQUE5QyxDQUFQLEVBQ0ssSUFETCxDQUNVLFVBQUMsR0FBRCxFQUFTO0FBQ1gsWUFBTSxTQUFTLElBQUksY0FBSixDQUFtQixNQUFsQztBQUNBLFlBQU0sWUFBWSxPQUNiLE1BRGEsQ0FDTixVQUFDLE1BQUQ7QUFBQSxtQkFBWSxPQUFPLEtBQVAsSUFBZ0IsR0FBNUI7QUFBQSxTQURNLEVBRWIsR0FGYSxDQUVULFVBQUMsTUFBRCxFQUFZO0FBQ2IsbUJBQU87QUFDSCxzQkFBTSxPQUFPLElBRFY7QUFFSCx1QkFBTyxPQUFPO0FBRlgsYUFBUDtBQUlILFNBUGEsQ0FBbEI7QUFRQSxZQUFJLG9CQUFKLENBQXlCLFNBQXpCO0FBQ0EsWUFBSSxnQkFBSixDQUFxQixTQUFyQjtBQUNBO0FBQ0gsS0FkTDtBQWVILENBaEJEOztBQW1CQSxJQUFJLG9CQUFKLEdBQTJCLFVBQUMsS0FBRCxFQUFXO0FBQ2xDLFVBQU0sT0FBTixDQUFjLFVBQUMsSUFBRCxFQUFVO0FBQ3BCLFVBQUUsSUFBRixDQUFPLElBQUksV0FBSixDQUFnQixJQUFJLGFBQUosQ0FBa0IsVUFBbEMsRUFBOEMsS0FBSyxJQUFuRCxDQUFQLEVBQ0MsSUFERCxDQUNNLFVBQUMsR0FBRCxFQUFTO0FBQ1g7QUFDQSxnQkFBTSxPQUFPLElBQUksT0FBSixDQUFZLEdBQXpCOztBQUVBO0FBQ0EsZ0JBQU0sU0FBUyxJQUFJLE9BQUosQ0FBWSxPQUFaLEVBQXFCLE1BQXBDOztBQUVBO0FBQ0EsZ0JBQU0sU0FBUyxLQUNWLE1BRFUsQ0FDSCxVQUFDLEdBQUQ7QUFBQSx1QkFBUyxJQUFJLEtBQUosSUFBYSxFQUF0QjtBQUFBLGFBREcsRUFFVixHQUZVLENBRU4sVUFBQyxHQUFELEVBQVM7QUFDVix1QkFBTztBQUNILDBCQUFNLElBQUksSUFEUDtBQUVILDJCQUFPLElBQUk7QUFGUixpQkFBUDtBQUlILGFBUFUsQ0FBZjs7QUFTQTtBQUNBLGdCQUFHLFdBQVcsS0FBSyxJQUFuQixFQUF3QjtBQUNwQixxQkFBSyxJQUFMLEdBQVksTUFBWjtBQUNIO0FBQ0osU0F0QkQ7QUF1QkgsS0F4QkQ7QUF5QkEsV0FBTyxLQUFQO0FBQ0gsQ0EzQkQ7O0FBNkJBLElBQUksZ0JBQUosR0FBdUIsVUFBQyxLQUFELEVBQVc7QUFDOUIsVUFBTSxPQUFOLENBQWMsVUFBQyxNQUFELEVBQVk7QUFDdEIsZ0JBQVEsR0FBUixDQUFhLEtBQUssS0FBTCxDQUFXLE9BQU8sT0FBTyxLQUFkLEVBQXFCLE9BQXJCLENBQTZCLENBQTdCLElBQWtDLEdBQTdDLENBQWI7O0FBRUEsWUFBTSxhQUFhLEVBQUUsV0FBRixFQUFlLFFBQWYsQ0FBd0IsWUFBeEIsQ0FBbkI7QUFDQSxZQUFNLGVBQWUsS0FBSyxLQUFMLENBQVcsT0FBTyxPQUFPLEtBQWQsRUFBcUIsT0FBckIsQ0FBNkIsQ0FBN0IsSUFBa0MsR0FBN0MsQ0FBckI7O0FBRUEsVUFBRSxNQUFGLEVBQVUsTUFBVixDQUFpQixVQUFqQjs7QUFFQSxVQUFFLFVBQUYsRUFBYyxNQUFkLGtIQUdjLE9BQU8sSUFIckIsNE9BT3lFLFlBUHpFO0FBYUgsS0FyQkQ7QUFzQkEsTUFBRSw4QkFBRixFQUFrQyxHQUFsQyxDQUFzQyxFQUFDLE9BQU8sS0FBUixFQUF0QztBQUNILENBeEJEOztBQTBCQSxJQUFJLE1BQUosR0FBYSxZQUFNO0FBQ2Y7QUFDQSxNQUFFLGFBQUYsRUFBaUIsRUFBakIsQ0FBb0IsUUFBcEIsRUFBOEIsVUFBUyxDQUFULEVBQVc7QUFDckMsVUFBRSxjQUFGO0FBQ0osWUFBSSxZQUFKLEdBQW1CLEVBQUUsSUFBRixFQUFRLElBQVIsQ0FBYSxvQkFBYixFQUFtQyxHQUFuQyxFQUFuQjtBQUNBLFlBQUksaUJBQUosQ0FBc0IsSUFBSSxZQUExQjtBQUNJO0FBQ0gsS0FMRDtBQU1ILENBUkQ7O0FBV0E7QUFDQSxJQUFJLElBQUosR0FBVyxZQUFNO0FBQ2IsUUFBSSxNQUFKO0FBSUgsQ0FMRDtBQU1BO0FBQ0EsRUFBRSxJQUFJLElBQU47O0FBR0E7O0FBRUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBvaEhleSA9IFwiSGVsbG8gV29ybGRcIjtcblxuY29uc3QgYXBwID0ge307XG4vLyBMYXN0LmZtIHNpbWlsYXIgYXJ0aXN0IGFwaSB1cmxcbmFwcC5hcGlLZXkgPSBgYTU3ZTgzYzQ5MmJjNGEwYWMzNmYxOGU0N2FhYWY5YjdgXG5cbmFwcC5hcnRpc3RNZXRob2RzID0ge1xuICAgIHNlYXJjaDogJ3NlYXJjaCcsXG4gICAgZ2V0SW5mbzogJ2dldEluZm8nLFxuICAgIGdldFNpbWlsYXI6ICdnZXRTaW1pbGFyJyxcbiAgICBnZXRUb3BUcmFja3M6ICdnZXRUb3BUcmFja3MnLFxuICAgIGdldFRvcEFsYnVtczogJ2dldFRvcEFsYnVtcycsXG4gICAgZ2V0VG9wVGFnczogJ2dldFRvcFRhZ3MnLFxufVxuXG4vLyBGdW5jdGlvbiB0byBtYWtlIGFwaSBjYWxscyBmb3IgYXJ0aXN0c1xuLy8gUGFyYW0gMSAtIHRoZSB0eXBlIG9mIGNhbGwgeW91IHdhbnQgdG8gbWFrZSB8IFBhcmFtIDIgLSB0aGUgYXJ0aXN0IHlvdSdyZSBtYWtpbmcgdGhlIHF1ZXJ5aW5nIGZvclxuYXBwLmFydGlzdFF1ZXJ5ID0gKG1ldGhvZCwgYXJ0aXN0KSA9PiB7XG4gICAgYXBwLmFydGlzdFVybCA9IGBodHRwOi8vd3MuYXVkaW9zY3JvYmJsZXIuY29tLzIuMC8/bWV0aG9kPWFydGlzdC4ke21ldGhvZH1gXG4gICAgcmV0dXJuICQuYWpheCh7XG4gICAgICAgIHVybDogYXBwLmFydGlzdFVybCxcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXJ0aXN0LFxuICAgICAgICAgICAgYXBpX2tleTogYXBwLmFwaUtleSxcbiAgICAgICAgICAgIGZvcm1hdDogJ2pzb24nLFxuICAgICAgICB9XG4gICAgfSlcbn07XG5cbi8vIFxuLy8gY3JlYXRlIGEgbmV3IGFycmF5IG9mIHNpbWlsYXIgYXJ0aXN0IG5hbWVzIHRoYXQgd2UgY2FuIHBhc3MgYXMgdGhlIFwiYXJ0aXN0IHZhbHVlIGZvciBvdXIgb3RoZXIgYXBpIGNhbGxzXG5hcHAuZ2V0U2ltaWxhckFydGlzdHMgPSAoYXJ0aXN0KSA9PiB7XG4gICAgJC53aGVuKGFwcC5hcnRpc3RRdWVyeShhcHAuYXJ0aXN0TWV0aG9kcy5nZXRTaW1pbGFyLCBhcnRpc3QpKVxuICAgICAgICAudGhlbigocmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhcnRpc3QgPSByZXMuc2ltaWxhcmFydGlzdHMuYXJ0aXN0O1xuICAgICAgICAgICAgY29uc3QgYXJ0aXN0QXJyID0gYXJ0aXN0XG4gICAgICAgICAgICAgICAgLmZpbHRlcigoYXJ0aXN0KSA9PiBhcnRpc3QubWF0Y2ggPj0gLjI1KVxuICAgICAgICAgICAgICAgIC5tYXAoKGFydGlzdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYXJ0aXN0Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaDogYXJ0aXN0Lm1hdGNoXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGFwcC5nZXRTaW1pbGFyQXJ0aXN0VGFncyhhcnRpc3RBcnIpXG4gICAgICAgICAgICBhcHAuY3JlYXRlQXJ0aXN0Q2FyZChhcnRpc3RBcnIpXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhcnRpc3RBcnIpXG4gICAgICAgIH0pXG59XG5cblxuYXBwLmdldFNpbWlsYXJBcnRpc3RUYWdzID0gKGFycmF5KSA9PiB7XG4gICAgYXJyYXkuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICAkLndoZW4oYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFRvcFRhZ3MsIGl0ZW0ubmFtZSkpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhIHZhcmlhYmxlIGZvciB0aGUgdGFncyBhcnJheVxuICAgICAgICAgICAgY29uc3QgdGFncyA9IHJlcy50b3B0YWdzLnRhZ1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBnZXQgdGhlIGFydGlzdCBhc3NvY2lhdGVkIHdpdGggZWFjaCB0YWdzIGFycmF5XG4gICAgICAgICAgICBjb25zdCBhcnRpc3QgPSByZXMudG9wdGFnc1snQGF0dHInXS5hcnRpc3RcblxuICAgICAgICAgICAgLy8gZmlsdGVyIHRoZSB0YWdzIHRvIHRob3NlIHdobyBhcmUgYSBtYXRjaCA+PSAxMCwgdGhlbiBzdHJpcCB0aGVtIHRvIHRoZSBlc3NlbnRpYWwgaW5mbyB1c2luZyBtYXBcbiAgICAgICAgICAgIGNvbnN0IHRhZ0FyciA9IHRhZ3NcbiAgICAgICAgICAgICAgICAuZmlsdGVyKCh0YWcpID0+IHRhZy5jb3VudCA+PSAxMClcbiAgICAgICAgICAgICAgICAubWFwKCh0YWcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRhZy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IHRhZy5jb3VudFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gaWYgdGhlIHRhZyBhcnRpc3QgbWF0Y2hlcyB0aGUgaW5pdGlhbCBhcnJheSBpdGVtJ3MgYXJ0aXN0LCBhZGQgdGhlIHRhZ3MgYXMgYSBwcm9wZXJ0eSBvZiB0aGF0IGl0ZW1cbiAgICAgICAgICAgIGlmKGFydGlzdCA9PT0gaXRlbS5uYW1lKXtcbiAgICAgICAgICAgICAgICBpdGVtLnRhZ3MgPSB0YWdBcnJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9KTtcbiAgICByZXR1cm4gYXJyYXlcbn1cblxuYXBwLmNyZWF0ZUFydGlzdENhcmQgPSAoYXJyYXkpID0+IHtcbiAgICBhcnJheS5mb3JFYWNoKChhcnRpc3QpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coIE1hdGguZmxvb3IoTnVtYmVyKGFydGlzdC5tYXRjaCkudG9GaXhlZCgyKSAqIDE4MCkpO1xuXG4gICAgICAgIGNvbnN0IGFydGlzdENhcmQgPSAkKFwiPHNlY3Rpb24+XCIpLmFkZENsYXNzKCdhcnRpc3RDYXJkJylcbiAgICAgICAgY29uc3QgcGVyY2VudE1hdGNoID0gTWF0aC5mbG9vcihOdW1iZXIoYXJ0aXN0Lm1hdGNoKS50b0ZpeGVkKDIpICogMTAwKVxuXG4gICAgICAgICQoJ21haW4nKS5hcHBlbmQoYXJ0aXN0Q2FyZClcblxuICAgICAgICAkKGFydGlzdENhcmQpLmFwcGVuZChgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkX19iYW5uZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhcnRpc3RDYXJkX19uYW1lXCI+XG4gICAgICAgICAgICAgICAgPGgzPiR7YXJ0aXN0Lm5hbWV9PC9oMz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmRfX21hdGNoXCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmRfX21hdGNoIGFydGlzdENhcmRfX21hdGNoLS1vdXRlckJhclwiPlxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYXJ0aXN0Q2FyZF9fbWF0Y2ggYXJ0aXN0Q2FyZF9fbWF0Y2gtLWlubmVyQmFyXCI+JHtwZXJjZW50TWF0Y2h9JTwvZGl2PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImFydGlzdENhcmRfX2V4cGFuZFwiPjwvZGl2PlxuICAgICAgICBgKVxuICAgIH0pO1xuICAgICQoJy5hcnRpc3RDYXJkX19tYXRjaC0taW5uZXJCYXInKS5jc3Moe3dpZHRoOiBcIjUwJVwifSlcbn1cblxuYXBwLmV2ZW50cyA9ICgpID0+IHtcbiAgICAvLyBlIGV2ZW50cyBoZXJlLiBmb3JtIHN1Ym1pdHMsIGNsaWNrcyBldGMuLi5cbiAgICAkKCcuc2VhcmNoRm9ybScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbihlKXtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGFwcC5zZWFyY2hBcnRpc3QgPSAkKHRoaXMpLmZpbmQoJy5zZWFyY2hGb3JtX19pbnB1dCcpLnZhbCgpO1xuICAgIGFwcC5nZXRTaW1pbGFyQXJ0aXN0cyhhcHAuc2VhcmNoQXJ0aXN0KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYXBwLnNlYXJjaEFydGlzdCk7XG4gICAgfSlcbn07XG5cblxuLy8gSW5pdGlhbGl6ZSBhcHBcbmFwcC5pbml0ID0gKCkgPT4ge1xuICAgIGFwcC5ldmVudHMoKVxuICAgIFxuICAgIFxuICAgIFxufVxuLy8gRnVuY3Rpb24gcmVhZHlcbiQoYXBwLmluaXQpXG5cblxuLy8gRFlOQU1JQyBNQVRDSCBTQ0FMRSAtIGZvciBzaW1pbGFyIGFydGlzdHMgZW5kIHBvaW50LCB0aGVyZSBpcyBhIG1hdGNoIHNjb3JlIHJlbGV0aXZlIHRvIHRoZSBzZWFyY2hlZCBhcnRpc3RzIDAtMVxuXG4vLyBvbiB1c2VyIGlucHV0IC0gZ2V0U2ltaWxhciJdfQ==
