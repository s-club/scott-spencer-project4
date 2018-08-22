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
app.getSimilarArtists = $.when(app.artistQuery(app.artistMethods.getSimilar, "Local Natives")).then(function (res) {
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
    console.log(artistArr);
});

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

app.events = function () {
    // e events here. form submits, clicks etc...
};

// Initialize app
app.init = function () {
    app.events();
    app.getSimilarArtists;
};
// Function ready
$(app.init);

// DYNAMIC MATCH SCALE - for similar artists end point, there is a match score reletive to the searched artists 0-1

// on user input - getSimilar

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsYUFBZDs7QUFFQSxJQUFNLE1BQU0sRUFBWjtBQUNBO0FBQ0EsSUFBSSxNQUFKOztBQUVBLElBQUksYUFBSixHQUFvQjtBQUNoQixZQUFRLFFBRFE7QUFFaEIsYUFBUyxTQUZPO0FBR2hCLGdCQUFZLFlBSEk7QUFJaEIsa0JBQWMsY0FKRTtBQUtoQixrQkFBYyxjQUxFO0FBTWhCLGdCQUFZOztBQUdoQjtBQUNBO0FBVm9CLENBQXBCLENBV0EsSUFBSSxXQUFKLEdBQWtCLFVBQUMsTUFBRCxFQUFTLE1BQVQsRUFBb0I7QUFDbEMsUUFBSSxTQUFKLHdEQUFtRSxNQUFuRTtBQUNBLFdBQU8sRUFBRSxJQUFGLENBQU87QUFDVixhQUFLLElBQUksU0FEQztBQUVWLGdCQUFRLEtBRkU7QUFHVixrQkFBVSxNQUhBO0FBSVYsY0FBTTtBQUNGLDBCQURFO0FBRUYscUJBQVMsSUFBSSxNQUZYO0FBR0Ysb0JBQVE7QUFITjtBQUpJLEtBQVAsQ0FBUDtBQVVILENBWkQ7O0FBY0E7QUFDQTtBQUNBLElBQUksaUJBQUosR0FDQSxFQUFFLElBQUYsQ0FBTyxJQUFJLFdBQUosQ0FBZ0IsSUFBSSxhQUFKLENBQWtCLFVBQWxDLEVBQThDLGVBQTlDLENBQVAsRUFDQyxJQURELENBQ00sVUFBQyxHQUFELEVBQVM7QUFDWCxRQUFNLFNBQVMsSUFBSSxjQUFKLENBQW1CLE1BQWxDO0FBQ0EsUUFBTSxZQUFZLE9BQ2IsTUFEYSxDQUNOLFVBQUMsTUFBRDtBQUFBLGVBQVksT0FBTyxLQUFQLElBQWdCLEdBQTVCO0FBQUEsS0FETSxFQUViLEdBRmEsQ0FFVCxVQUFDLE1BQUQsRUFBWTtBQUNiLGVBQU87QUFDSCxrQkFBTSxPQUFPLElBRFY7QUFFSCxtQkFBTyxPQUFPO0FBRlgsU0FBUDtBQUlILEtBUGEsQ0FBbEI7QUFRSSxRQUFJLG9CQUFKLENBQXlCLFNBQXpCO0FBQ0EsWUFBUSxHQUFSLENBQVksU0FBWjtBQUNQLENBYkQsQ0FEQTs7QUFnQkEsSUFBSSxvQkFBSixHQUEyQixVQUFDLEtBQUQsRUFBVztBQUNsQyxVQUFNLE9BQU4sQ0FBYyxVQUFDLElBQUQsRUFBVTtBQUNwQixVQUFFLElBQUYsQ0FBTyxJQUFJLFdBQUosQ0FBZ0IsSUFBSSxhQUFKLENBQWtCLFVBQWxDLEVBQThDLEtBQUssSUFBbkQsQ0FBUCxFQUNDLElBREQsQ0FDTSxVQUFDLEdBQUQsRUFBUztBQUNYO0FBQ0EsZ0JBQU0sT0FBTyxJQUFJLE9BQUosQ0FBWSxHQUF6Qjs7QUFFQTtBQUNBLGdCQUFNLFNBQVMsSUFBSSxPQUFKLENBQVksT0FBWixFQUFxQixNQUFwQzs7QUFFQTtBQUNBLGdCQUFNLFNBQVMsS0FDVixNQURVLENBQ0gsVUFBQyxHQUFEO0FBQUEsdUJBQVMsSUFBSSxLQUFKLElBQWEsRUFBdEI7QUFBQSxhQURHLEVBRVYsR0FGVSxDQUVOLFVBQUMsR0FBRCxFQUFTO0FBQ1YsdUJBQU87QUFDSCwwQkFBTSxJQUFJLElBRFA7QUFFSCwyQkFBTyxJQUFJO0FBRlIsaUJBQVA7QUFJSCxhQVBVLENBQWY7O0FBU0E7QUFDQSxnQkFBRyxXQUFXLEtBQUssSUFBbkIsRUFBd0I7QUFDcEIscUJBQUssSUFBTCxHQUFZLE1BQVo7QUFDSDtBQUNKLFNBdEJEO0FBdUJILEtBeEJEO0FBeUJBLFdBQU8sS0FBUDtBQUNILENBM0JEOztBQTZCQSxJQUFJLE1BQUosR0FBYSxZQUFNO0FBQ2Y7QUFDSCxDQUZEOztBQUtBO0FBQ0EsSUFBSSxJQUFKLEdBQVcsWUFBTTtBQUNiLFFBQUksTUFBSjtBQUNBLFFBQUksaUJBQUo7QUFHSCxDQUxEO0FBTUE7QUFDQSxFQUFFLElBQUksSUFBTjs7QUFHQTs7QUFFQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IG9oSGV5ID0gXCJIZWxsbyBXb3JsZFwiO1xuXG5jb25zdCBhcHAgPSB7fTtcbi8vIExhc3QuZm0gc2ltaWxhciBhcnRpc3QgYXBpIHVybFxuYXBwLmFwaUtleSA9IGBhNTdlODNjNDkyYmM0YTBhYzM2ZjE4ZTQ3YWFhZjliN2BcblxuYXBwLmFydGlzdE1ldGhvZHMgPSB7XG4gICAgc2VhcmNoOiAnc2VhcmNoJyxcbiAgICBnZXRJbmZvOiAnZ2V0SW5mbycsXG4gICAgZ2V0U2ltaWxhcjogJ2dldFNpbWlsYXInLFxuICAgIGdldFRvcFRyYWNrczogJ2dldFRvcFRyYWNrcycsXG4gICAgZ2V0VG9wQWxidW1zOiAnZ2V0VG9wQWxidW1zJyxcbiAgICBnZXRUb3BUYWdzOiAnZ2V0VG9wVGFncycsXG59XG5cbi8vIEZ1bmN0aW9uIHRvIG1ha2UgYXBpIGNhbGxzIGZvciBhcnRpc3RzXG4vLyBQYXJhbSAxIC0gdGhlIHR5cGUgb2YgY2FsbCB5b3Ugd2FudCB0byBtYWtlIHwgUGFyYW0gMiAtIHRoZSBhcnRpc3QgeW91J3JlIG1ha2luZyB0aGUgcXVlcnlpbmcgZm9yXG5hcHAuYXJ0aXN0UXVlcnkgPSAobWV0aG9kLCBhcnRpc3QpID0+IHtcbiAgICBhcHAuYXJ0aXN0VXJsID0gYGh0dHA6Ly93cy5hdWRpb3Njcm9iYmxlci5jb20vMi4wLz9tZXRob2Q9YXJ0aXN0LiR7bWV0aG9kfWBcbiAgICByZXR1cm4gJC5hamF4KHtcbiAgICAgICAgdXJsOiBhcHAuYXJ0aXN0VXJsLFxuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhcnRpc3QsXG4gICAgICAgICAgICBhcGlfa2V5OiBhcHAuYXBpS2V5LFxuICAgICAgICAgICAgZm9ybWF0OiAnanNvbicsXG4gICAgICAgIH1cbiAgICB9KVxufTtcblxuLy8gXG4vLyBjcmVhdGUgYSBuZXcgYXJyYXkgb2Ygc2ltaWxhciBhcnRpc3QgbmFtZXMgdGhhdCB3ZSBjYW4gcGFzcyBhcyB0aGUgXCJhcnRpc3QgdmFsdWUgZm9yIG91ciBvdGhlciBhcGkgY2FsbHNcbmFwcC5nZXRTaW1pbGFyQXJ0aXN0cyA9XG4kLndoZW4oYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFNpbWlsYXIsIFwiTG9jYWwgTmF0aXZlc1wiKSlcbi50aGVuKChyZXMpID0+IHtcbiAgICBjb25zdCBhcnRpc3QgPSByZXMuc2ltaWxhcmFydGlzdHMuYXJ0aXN0O1xuICAgIGNvbnN0IGFydGlzdEFyciA9IGFydGlzdFxuICAgICAgICAuZmlsdGVyKChhcnRpc3QpID0+IGFydGlzdC5tYXRjaCA+PSAuMjUpXG4gICAgICAgIC5tYXAoKGFydGlzdCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBhcnRpc3QubmFtZSxcbiAgICAgICAgICAgICAgICBtYXRjaDogYXJ0aXN0Lm1hdGNoXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBhcHAuZ2V0U2ltaWxhckFydGlzdFRhZ3MoYXJ0aXN0QXJyKVxuICAgICAgICBjb25zb2xlLmxvZyhhcnRpc3RBcnIpXG59KVxuXG5hcHAuZ2V0U2ltaWxhckFydGlzdFRhZ3MgPSAoYXJyYXkpID0+IHtcbiAgICBhcnJheS5mb3JFYWNoKChpdGVtKSA9PiB7XG4gICAgICAgICQud2hlbihhcHAuYXJ0aXN0UXVlcnkoYXBwLmFydGlzdE1ldGhvZHMuZ2V0VG9wVGFncywgaXRlbS5uYW1lKSlcbiAgICAgICAgLnRoZW4oKHJlcykgPT4ge1xuICAgICAgICAgICAgLy8gY3JlYXRlIGEgdmFyaWFibGUgZm9yIHRoZSB0YWdzIGFycmF5XG4gICAgICAgICAgICBjb25zdCB0YWdzID0gcmVzLnRvcHRhZ3MudGFnXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGdldCB0aGUgYXJ0aXN0IGFzc29jaWF0ZWQgd2l0aCBlYWNoIHRhZ3MgYXJyYXlcbiAgICAgICAgICAgIGNvbnN0IGFydGlzdCA9IHJlcy50b3B0YWdzWydAYXR0ciddLmFydGlzdFxuXG4gICAgICAgICAgICAvLyBmaWx0ZXIgdGhlIHRhZ3MgdG8gdGhvc2Ugd2hvIGFyZSBhIG1hdGNoID49IDEwLCB0aGVuIHN0cmlwIHRoZW0gdG8gdGhlIGVzc2VudGlhbCBpbmZvIHVzaW5nIG1hcFxuICAgICAgICAgICAgY29uc3QgdGFnQXJyID0gdGFnc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoKHRhZykgPT4gdGFnLmNvdW50ID49IDEwKVxuICAgICAgICAgICAgICAgIC5tYXAoKHRhZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdGFnLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogdGFnLmNvdW50XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBpZiB0aGUgdGFnIGFydGlzdCBtYXRjaGVzIHRoZSBpbml0aWFsIGFycmF5IGl0ZW0ncyBhcnRpc3QsIGFkZCB0aGUgdGFncyBhcyBhIHByb3BlcnR5IG9mIHRoYXQgaXRlbVxuICAgICAgICAgICAgaWYoYXJ0aXN0ID09PSBpdGVtLm5hbWUpe1xuICAgICAgICAgICAgICAgIGl0ZW0udGFncyA9IHRhZ0FyclxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0pO1xuICAgIHJldHVybiBhcnJheVxufVxuXG5hcHAuZXZlbnRzID0gKCkgPT4ge1xuICAgIC8vIGUgZXZlbnRzIGhlcmUuIGZvcm0gc3VibWl0cywgY2xpY2tzIGV0Yy4uLlxufTtcblxuXG4vLyBJbml0aWFsaXplIGFwcFxuYXBwLmluaXQgPSAoKSA9PiB7XG4gICAgYXBwLmV2ZW50cygpXG4gICAgYXBwLmdldFNpbWlsYXJBcnRpc3RzO1xuICAgIFxuICAgIFxufVxuLy8gRnVuY3Rpb24gcmVhZHlcbiQoYXBwLmluaXQpXG5cblxuLy8gRFlOQU1JQyBNQVRDSCBTQ0FMRSAtIGZvciBzaW1pbGFyIGFydGlzdHMgZW5kIHBvaW50LCB0aGVyZSBpcyBhIG1hdGNoIHNjb3JlIHJlbGV0aXZlIHRvIHRoZSBzZWFyY2hlZCBhcnRpc3RzIDAtMVxuXG4vLyBvbiB1c2VyIGlucHV0IC0gZ2V0U2ltaWxhciJdfQ==
