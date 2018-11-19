import React from 'react'
import { I18nextProvider } from 'react-i18next'

// import hoistNonReactStatic from 'hoist-non-react-statics'

export default function (WrappedComponent) {
  const { i18n } = this
  return class extends React.Component {
    static async getInitialProps({ Component, ctx }) {
      // Recompile pre-existing pageProps
      let pageProps = {}
      if (Component.getInitialProps) {
        pageProps = await Component.getInitialProps(ctx)
      }
      // if (WrappedComponent.getInitialProps) {
      //   pageProps = {
      //     ...pageProps,
      //     ...await WrappedComponent.getInitialProps(ctx),
      //   }
      // }

      // Initiate vars to return
      const { req } = ctx
      let initialI18nStore = {}
      let initialLanguage = null

      // Load translations to serialize if we're serverside
      if (req && req.i18n) {
        [initialLanguage] = req.i18n.languages
        i18n.language = initialLanguage
        req.i18n.languages.forEach((l) => {
          initialI18nStore[l] = {}
          i18n.nsFromReactTree.forEach((ns) => {
            initialI18nStore[l][ns] = (req.i18n.services.resourceStore.data[l] || {})[ns] || {}
          })
        })
      } else {
        // Load newly-required translations if changing route clientside
        await Promise.all(
          i18n.nsFromReactTree
            .filter(ns => !i18n.hasResourceBundle(i18n.languages[0], ns))
            .map(ns => new Promise(resolve => i18n.loadNamespaces(ns, () => resolve()))),
        )
        initialI18nStore = i18n.store.data
        initialLanguage = i18n.language
      }

      // `pageProps` will get serialized automatically by NextJs
      return {
        initialI18nStore,
        initialLanguage,
        ...pageProps,
      }
    }

    render() {
      // ... and renders the wrapped component with the fresh data!
      // Notice that we pass through any additional props
      let { initialLanguage, initialI18nStore } = this.props
      if (!process.browser) {
        initialLanguage = i18n.language
        initialI18nStore = i18n.store.data
      }
      return (
        <I18nextProvider
          i18n={i18n}
          initialLanguage={initialLanguage}
          initialI18nStore={initialI18nStore}
        >
          <WrappedComponent {...this.props} />
        </I18nextProvider>
      )
    }
  }
}
