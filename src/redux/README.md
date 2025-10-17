Redux is optional. This template does not wire Redux by default to keep the starter compatible with Expo Go out-of-the-box.

To add Redux later:

1) Install: `npm i @reduxjs/toolkit react-redux`
2) Create store in `src/redux/store.ts` and slices in `src/redux/slices/*`.
3) Wrap `App` with `<Provider store={store}>`.

