import WPickerColumn from './WPickerColumn'

// Types
import { PropValidator } from 'vue/types/options'
import { VNode } from 'vue'

// Mixins
import { factory as ToaaleableFactory } from '@/mixins/toggleable'

// Utils
import mixins from '@/utils/mixins'
import cloneDeep from 'lodash/cloneDeep'

// height of th option item
const ITEM_HEIGHT = 34

type WPickerColumnInstance = InstanceType<typeof WPickerColumn>

type Column = {
  options: any[]
  [key: string]: any
}

type simpleColumns = Array<string | number | object>

type Columns = Array<Array<string | number | Column>>

export default mixins(ToaaleableFactory('visible', 'update:visible')).extend({
  name: 'w-picker',

  props: {
    confirmText: {
      type: String,
      default: '确定',
    },
    cancelText: {
      type: String,
      default: '取消',
    },
    closeOnClickMask: {
      type: Boolean,
      default: true,
    },
    columns: {
      type: Array,
      default: () => [],
    } as PropValidator<Columns | simpleColumns>,
    valueKey: String,
    visibleItemCount: {
      type: Number,
      default: 7,
      validator: (val: number) => {
        return [3, 5, 7].includes(val)
      },
    },
    value: {
      type: Array,
      default: () => [],
    } as PropValidator<any>,
  },

  data () {
    return {
      children: [] as WPickerColumnInstance[],
    }
  },

  computed: {
    pickerBodyStyle (): object {
      return {
        height: this.visibleItemCount * ITEM_HEIGHT + 'px',
      }
    },

    simple (): boolean {
      return this.columns.length > 0 && !(this.columns[0] as Column).options
    },
  },

  watch: {
    columns (val) {
      this.setColumns(val)
    },

    value (val) {
      this.setValues(val)
    },
  },

  mounted () {
    this.setValues(this.value)
  },

  methods: {
    open (): void {
      this.isActive = true
    },

    close (): void {
      this.isActive = false
    },

    setColumns (columns: Columns | simpleColumns): void {
      columns.forEach((column, index: number) => {
        this.setColumnOptions(index, cloneDeep((column as Column).options))
      })
    },

    columnValueChange (columnIndex: number): void {
      if (this.simple) {
        this.$emit('change', this, this.getColumnOptions(0), this.getColumnIndex(0))
      } else {
        this.$emit('change', this, this.getValues(), columnIndex)
      }
    },

    // get column instance
    getColumn (columnIndex: number) {
      const { children } = this
      return children.find((child, index) => {
        return child.$options.name === 'w-picker-column' && index === columnIndex
      })
    },

    // get column value by index
    getColumnValue (columnIndex: number): any {
      const column = this.getColumn(columnIndex)
      return column && column.getValue()
    },

    // set column value by index
    setColumnValue (columnIndex: number, value: any): void {
      const column = this.getColumn(columnIndex)
      column && column.setValue(value)
    },

    // set options of column by index
    setColumnOptions (columnIndex: number, options: Array<string | number | object>): void {
      const column = this.columns[columnIndex]
      if (column) {
        ;(column as Column).options = options
      }
    },

    // get options of column by index
    getColumnOptions (columnIndex: number): Array<string | number> {
      return (this.columns[columnIndex] as Column).options
    },

    // get values of all columns
    getValues (): any[] {
      return this.children.map(child => child.getValue())
    },

    // set values of all columns
    setValues (values: any[]): void {
      values.forEach((value, index) => {
        this.setColumnValue(index, value)
      })
    },

    // get column option index by column index
    getColumnIndex (columnIndex: number): number {
      return this.getColumn(columnIndex)!.currentIndex
    },

    // set column option index by column index
    setColumnIndex (columnIndex: number, index: number): void {
      const column = this.getColumn(columnIndex)
      column && column.setIndex(index)
    },

    // get indexes of all columns
    getIndexes (): number[] {
      return this.children.map(child => child.currentIndex)
    },

    // set indexes of all columns
    setIndexes (indexes: number[]): void {
      indexes.forEach((optionIndex, columnIndex) => {
        this.setColumnIndex(columnIndex, optionIndex)
      })
    },

    onClickMask (): void {
      if (!this.closeOnClickMask) return

      this.onCancel()
    },

    onCancel (): void {
      this.$emit('cancel', this)
      this.isActive = false
    },

    // confirm event handler
    onConfirm (): void {
      this.$emit('input', this.getValues())
      this.$emit('confirm', this)
      this.isActive = false
    },
  },

  render (): VNode {
    return (
      <div>
        <div vShow={this.isActive} class="weui-mask weui-animate-fade-in" onClick={this.onClickMask} />
        <transition enter-active-class="weui-animate-slide-up" leave-active-class="weui-animate-slide-down">
          <div vShow={this.isActive} class="weui-half-screen-dialog weui-picker weui-animate-slide-up">
            <div class="weui-half-screen-dialog__hd">
              <div class="weui-half-screen-dialog__hd__side">
                <button class="weui-icon-btn weui-icon-btn_close weui-picker__btn" onClick={this.onCancel}>关闭</button>
              </div>
              <div class="weui-half-screen-dialog__hd__main"><strong class="weui-half-screen-dialog__title">单列选择器</strong>
              </div>
            </div>

            <div class="weui-half-screen-dialog__bd">
              <div class="weui-picker__bd" style={this.pickerBodyStyle}>
                {(this.simple ? [this.columns] : this.columns).map((column, index) => (
                  <WPickerColumn
                    key={index}
                    options={this.simple ? column : (column as any).options}
                    valueKey={this.valueKey}
                    defaultIndex={(column as any).defaultIndex}
                    visibleItemCount={this.visibleItemCount}
                    onChange={() => {
                      this.columnValueChange(index)
                    }}
                  />
                ))}
              </div>
            </div>
            <div class="weui-half-screen-dialog__ft">
              <a href="javascript:;" class="weui-btn weui-btn_primary weui-picker__btn" id="weui-picker-confirm" data-action="select">确定</a>
            </div>
          </div>
        </transition>
      </div>
    )
  },
})
