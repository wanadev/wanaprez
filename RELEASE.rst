Things to do when releasing a new version
=========================================

This file is a memo for the maintainer.


0. Checks
---------

* Check copyright years in ``LICENSE``
* Rebuild ``wanaprez.dist.js`` (``npm run build``)


1. Release
----------

* Update version number in ``package.json``
* Edit / update changelog in ``README.rst``
* Commit / tag (``git commit -m vX.Y.Z && git tag vX.Y.Z && git push && git push --tags``)


2. Publish Github Release
-------------------------

* Make a release on Github
* Add changelog
