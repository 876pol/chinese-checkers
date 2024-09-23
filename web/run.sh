rm -r dist
parcel build index.html
cp -a fonts dist
cp -a img dist
cd dist || exit
python3 -m http.server