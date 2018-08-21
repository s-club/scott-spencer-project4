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
    app.similarArtistEndpoint = 'http://ws.audioscrobbler.com/2.0/?method=artist.' + method;
    $.ajax({
        url: app.similarArtistEndpoint,
        method: 'GET',
        dataType: 'json',
        data: {
            artist: artist,
            api_key: app.apiKey,
            format: 'json'
        }
    }).then(function (res) {
        // create conditionals for each method that apply html if method is used
        // call series of functions within conditional statements that save data to global scope
        if (method === app.artistMethods.getSimilar) {
            console.log(res.similarartists);
            return res.similarartists;
        }
        return res;
    });
};

app.events = function () {
    // e events here. form submits, clicks etc...
};

// Initialize app
app.init = function () {
    app.events();
    app.artistQuery(app.artistMethods.getSimilar, 'Radiohead');
};
// Function ready
$(app.init);

// DYNAMIC MATCH SCALE - for similar artists end point, there is a match score reletive to the searched artists 0-1

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkZXYvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFNLFFBQVEsYUFBZDs7QUFFQSxJQUFNLE1BQU0sRUFBWjtBQUNBO0FBQ0EsSUFBSSxNQUFKOztBQUVBLElBQUksYUFBSixHQUFvQjtBQUNoQixZQUFRLFFBRFE7QUFFaEIsYUFBUyxTQUZPO0FBR2hCLGdCQUFZLFlBSEk7QUFJaEIsa0JBQWMsY0FKRTtBQUtoQixrQkFBYyxjQUxFO0FBTWhCLGdCQUFZOztBQUdoQjtBQUNBO0FBVm9CLENBQXBCLENBV0EsSUFBSSxXQUFKLEdBQWtCLFVBQUMsTUFBRCxFQUFTLE1BQVQsRUFBb0I7QUFDbEMsUUFBSSxxQkFBSix3REFBK0UsTUFBL0U7QUFDQSxNQUFFLElBQUYsQ0FBTztBQUNILGFBQUssSUFBSSxxQkFETjtBQUVILGdCQUFRLEtBRkw7QUFHSCxrQkFBVSxNQUhQO0FBSUgsY0FBTTtBQUNGLDBCQURFO0FBRUYscUJBQVMsSUFBSSxNQUZYO0FBR0Ysb0JBQVE7QUFITjtBQUpILEtBQVAsRUFTRyxJQVRILENBU1EsVUFBQyxHQUFELEVBQVM7QUFDYjtBQUNBO0FBQ0EsWUFBSSxXQUFXLElBQUksYUFBSixDQUFrQixVQUFqQyxFQUE2QztBQUN6QyxvQkFBUSxHQUFSLENBQVksSUFBSSxjQUFoQjtBQUNBLG1CQUFPLElBQUksY0FBWDtBQUNIO0FBQ0QsZUFBTyxHQUFQO0FBQ0gsS0FqQkQ7QUFrQkgsQ0FwQkQ7O0FBdUJBLElBQUksTUFBSixHQUFhLFlBQU07QUFDZjtBQUNILENBRkQ7O0FBS0E7QUFDQSxJQUFJLElBQUosR0FBVyxZQUFNO0FBQ2IsUUFBSSxNQUFKO0FBQ0EsUUFBSSxXQUFKLENBQWdCLElBQUksYUFBSixDQUFrQixVQUFsQyxFQUE4QyxXQUE5QztBQUNILENBSEQ7QUFJQTtBQUNBLEVBQUUsSUFBSSxJQUFOOztBQUdBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3Qgb2hIZXkgPSBcIkhlbGxvIFdvcmxkXCI7XG5cbmNvbnN0IGFwcCA9IHt9O1xuLy8gTGFzdC5mbSBzaW1pbGFyIGFydGlzdCBhcGkgdXJsXG5hcHAuYXBpS2V5ID0gYGE1N2U4M2M0OTJiYzRhMGFjMzZmMThlNDdhYWFmOWI3YFxuXG5hcHAuYXJ0aXN0TWV0aG9kcyA9IHtcbiAgICBzZWFyY2g6ICdzZWFyY2gnLFxuICAgIGdldEluZm86ICdnZXRJbmZvJyxcbiAgICBnZXRTaW1pbGFyOiAnZ2V0U2ltaWxhcicsXG4gICAgZ2V0VG9wVHJhY2tzOiAnZ2V0VG9wVHJhY2tzJyxcbiAgICBnZXRUb3BBbGJ1bXM6ICdnZXRUb3BBbGJ1bXMnLFxuICAgIGdldFRvcFRhZ3M6ICdnZXRUb3BUYWdzJyxcbn1cblxuLy8gRnVuY3Rpb24gdG8gbWFrZSBhcGkgY2FsbHMgZm9yIGFydGlzdHNcbi8vIFBhcmFtIDEgLSB0aGUgdHlwZSBvZiBjYWxsIHlvdSB3YW50IHRvIG1ha2UgfCBQYXJhbSAyIC0gdGhlIGFydGlzdCB5b3UncmUgbWFraW5nIHRoZSBxdWVyeWluZyBmb3JcbmFwcC5hcnRpc3RRdWVyeSA9IChtZXRob2QsIGFydGlzdCkgPT4ge1xuICAgIGFwcC5zaW1pbGFyQXJ0aXN0RW5kcG9pbnQgPSBgaHR0cDovL3dzLmF1ZGlvc2Nyb2JibGVyLmNvbS8yLjAvP21ldGhvZD1hcnRpc3QuJHttZXRob2R9YFxuICAgICQuYWpheCh7XG4gICAgICAgIHVybDogYXBwLnNpbWlsYXJBcnRpc3RFbmRwb2ludCxcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgYXJ0aXN0LFxuICAgICAgICAgICAgYXBpX2tleTogYXBwLmFwaUtleSxcbiAgICAgICAgICAgIGZvcm1hdDogJ2pzb24nLFxuICAgICAgICB9XG4gICAgfSkudGhlbigocmVzKSA9PiB7XG4gICAgICAgIC8vIGNyZWF0ZSBjb25kaXRpb25hbHMgZm9yIGVhY2ggbWV0aG9kIHRoYXQgYXBwbHkgaHRtbCBpZiBtZXRob2QgaXMgdXNlZFxuICAgICAgICAvLyBjYWxsIHNlcmllcyBvZiBmdW5jdGlvbnMgd2l0aGluIGNvbmRpdGlvbmFsIHN0YXRlbWVudHMgdGhhdCBzYXZlIGRhdGEgdG8gZ2xvYmFsIHNjb3BlXG4gICAgICAgIGlmIChtZXRob2QgPT09IGFwcC5hcnRpc3RNZXRob2RzLmdldFNpbWlsYXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcy5zaW1pbGFyYXJ0aXN0cyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLnNpbWlsYXJhcnRpc3RzXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc1xuICAgIH0pO1xufTtcblxuXG5hcHAuZXZlbnRzID0gKCkgPT4ge1xuICAgIC8vIGUgZXZlbnRzIGhlcmUuIGZvcm0gc3VibWl0cywgY2xpY2tzIGV0Yy4uLlxufTtcblxuXG4vLyBJbml0aWFsaXplIGFwcFxuYXBwLmluaXQgPSAoKSA9PiB7XG4gICAgYXBwLmV2ZW50cygpXG4gICAgYXBwLmFydGlzdFF1ZXJ5KGFwcC5hcnRpc3RNZXRob2RzLmdldFNpbWlsYXIsICdSYWRpb2hlYWQnKVxufVxuLy8gRnVuY3Rpb24gcmVhZHlcbiQoYXBwLmluaXQpXG5cblxuLy8gRFlOQU1JQyBNQVRDSCBTQ0FMRSAtIGZvciBzaW1pbGFyIGFydGlzdHMgZW5kIHBvaW50LCB0aGVyZSBpcyBhIG1hdGNoIHNjb3JlIHJlbGV0aXZlIHRvIHRoZSBzZWFyY2hlZCBhcnRpc3RzIDAtMSJdfQ==
