var ghpages = require('gh-pages');

ghpages.publish('dist', {
        branch: 'github-pages'
    },
    function (err) {
        if (err !== undefined) {
            console.log(err);
        }
    });