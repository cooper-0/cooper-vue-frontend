<template>
  <div class="document-editor">
    <div
        v-for="(line, index) in lines"
        :key="line.id"
        :id="line.id"
        class="editor-line"
        contenteditable="true"
        @input="handleInput(index, $event)"
        @keydown="handleKeyDown(index, $event)"
        :ref="'line-' + index"
    >
      {{ line.text }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    lines: Array,
  },
  data() {
    return {
      localContent: this.content,
    };
  },
  methods: {
    handleInput(index, event) {
      this.$emit('handle-input', index, event);
    },
    handleKeyDown(index, event) {
      this.$emit('handle-keydown', index, event);
    }
  },
};
</script>

<style scoped>
  .document-editor {
    position: absolute;
    padding: 10px;
    top: 130px;
    width: 1097px;
    box-sizing: border-box;
  }

  .editor-line {
    position: relative;
    height: 20px;
    padding: 4px;
    font-size: 16px;
    overflow: hidden;
    white-space: nowrap;
    border-radius: 5px;
    transition: background-color 0.3s ease;
  }

  .editor-line:hover {
    background-color: #ccc;
  }

  .content {
    min-height: 400px;
    overflow-y: auto;
    width: 100%;
    margin-top: 20px;
    border: 2px solid #ccc;
    padding: 5px;
    background-color: #fff;
    border-radius: 4px;
  }

  button {
    display: block;
    margin: 20px auto 0;
    padding: 10px 20px;
    background-color: #888;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  button:hover {
    background-color: #999;
  }

</style>
