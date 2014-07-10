# mathjax-minimal

This is a massively stripped down version of MathJax, primarily for use
as a bower package. It reduces install time by a factor of 10,
and file size by a factor of 100.

This only provides support for
+ English
+ TeX Input
+ HTML-CSS Output
 + STIX Font (woff)

You will need to provide your own configuration file. It should probably
include these settings:

    extensions: ["tex2jax.js"],
    jax: ["input/TeX", "output/HTML-CSS"],
    tex2jax: {
      inlineMath: [ ["\\(","\\)"] ],
      displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
      processEscapes: true
    },
    "HTML-CSS": { availableFonts: ["STIX"],
                  preferredFont: 'STIX',
                  webFont: 'STIX-Web',
                  imageFont: null
                 },

## Installation and Usage

The MathJax installation and usage documentation is available in the
`docs/html` directory of the MathJax distribution (see
`docs/html/index.html` for the starting point).  The documents are also
available on the MathJax web site on line at <http://www.mathjax.org/resources/docs/>.


## Community

The main MathJax website is <http://www.mathjax.org>, and it includes
announcements and other important information.  MathJax is maintained and
distributed on GitHub at <http://github.com/mathjax/MathJax>.  A user forum
for asking questions and getting assistance is hosted at Google, and the
bug tracker is hosted at GitHub:

Bug tracker:         <https://github.com/mathjax/MathJax/issues>  
MathJax-Users Group: <http://groups.google.com/group/mathjax-users>

Before reporting a bug, please check that it has not already been reported.
Also, please use the bug tracker for reporting bugs rather than the help forum.
