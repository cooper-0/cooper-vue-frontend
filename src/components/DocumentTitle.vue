<template>
    <div class="document-title">
      <div
        class="editable-title"
        contenteditable="true"
        spellcheck="true"
        @input="updateTitle"
        :style="titleStyle"
        ref="titleField"
      >{{ title }}</div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      initialTitle: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        title: this.initialTitle
      };
    },
    watch: {
      initialTitle(newTitle) {
        this.title = newTitle;
      }
    },
    computed: {
      titleStyle() {
        return {
          color: 'rgb(55, 53, 47)',
          fontWeight: '700',
          lineHeight: '1.2',
          fontSize: '40px',
          fontFamily: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"',
          cursor: 'text',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: '3px 2px',
          caretColor: 'rgb(55, 53, 47)'
        };
      }
    },
    methods: {
        updateTitle(event) {
          let text = event.target.textContent;
          if (text.length > 20) {
            event.target.textContent = text.slice(0, 20);
            this.title = text.slice(0, 20);
          } else {
            this.title = text;
          }
          let selection = window.getSelection();
          let range = document.createRange();
          range.selectNodeContents(event.target);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          this.$emit('title-updated', this.title);
        },
    },
    mounted() {
      this.$refs.titleField.innerText = this.initialTitle;
    }
  };
  </script>
  
  <style scoped>
  .document-title {
    position: absolute;
    top: 50px;
    width: 100%;
    max-width: 850px;
    background-color: #fff;
    padding: 5px 5px;
    box-sizing: border-box;
    border-bottom: 1px solid #ccc;
    z-index: 1;
  }
  
  .editable-title {
    max-width: 100%;
    width: 100%;
    margin: 1px;
  }
  </style>
  