'use strict';
import React, {Component} from 'react';
import {
    View, Text, Alert, AlertIOS, ListView, ListViewDataSource, StyleSheet,
    TouchableOpacity, InteractionManager, RefreshControl, Animated, Platform, Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import md5 from 'md5';

import data from './data.json';
const window = Dimensions.get('window');

class DynamicListRow extends Component {

    // these values will need to be fixed either within the component or sent through props
    _defaultHeightValue = 60;
    _defaultTransition  = 500;

    state = {
        _rowHeight  : new Animated.Value(this._defaultHeightValue),
        _rowOpacity : new Animated.Value(0)
    };

    componentDidMount() {
        Animated.timing(this.state._rowOpacity, {
            toValue  : 1,
            duration : this._defaultTransition
        }).start()
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.remove) {
            this.onRemoving(nextProps.onRemoving);
        } else {
            this.resetHeight()
        }
    }

    onRemoving(callback) {
        Animated.timing(this.state._rowHeight, {
            toValue  : 0,
            duration : this._defaultTransition
        }).start(callback);
    }

    resetHeight() {
        Animated.timing(this.state._rowHeight, {
            toValue  : this._defaultHeightValue,
            duration : 0
        }).start();
    }

    render() {
        return (
            <Animated.View
                style={{height: this.state._rowHeight, opacity: this.state._rowOpacity}}>
                {this.props.children}
            </Animated.View>
        );
    }
}

export default class DynamicList extends Component {

    /**
     * Default state values
     * */
    state = {
        loading     : true,
        dataSource  : new ListView.DataSource({
            rowHasChanged : (row1, row2) => true
        }),
        refreshing  : false,
        rowToDelete : null
    };

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            this._loadData()
        });
    }

    _loadData(refresh) {
        refresh && this.setState({
            refreshing : true
        });

        this.dataLoadSuccess({data : data});
    }

    dataLoadSuccess(result) {

        this._data = result.data;

        let ds = this.state.dataSource.cloneWithRows(this._data);

        this.setState({
            loading     : false,
            refreshing  : false,
            rowToDelete : -1,
            dataSource  : ds
        });
    }


    render() {
        return (
            <View style={styles.container}>
                <View style={styles.addPanel}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={()=> this._addItemPressed()}
                    >
                        <Text style={styles.addButtonText}>+ NEW</Text>
                    </TouchableOpacity>
                </View>
                <ListView
                    refreshControl={
                      <RefreshControl
                        refreshing={this.state.refreshing}
                        onRefresh={this._loadData.bind(this, true)}
                        tintColor="#00AEC7"
                        title="Loading..."
                        titleColor="#00AEC7"
                        colors={['#FFF', '#FFF', '#FFF']}
                        progressBackgroundColor="#00AEC7"

                      />
                    }
                    enableEmptySections={true}
                    dataSource={this.state.dataSource}
                    renderRow={this._renderRow.bind(this)}
                />
            </View>
        );
    }



    _renderRow(rowData, sectionID, rowID) {
        return (
            <DynamicListRow
                remove={rowData.id === this.state.rowToDelete}
                onRemoving={this._onAfterRemovingElement.bind(this)}
            >
                <View style={styles.rowStyle}>

                    <View style={styles.contact}>
                        <Text style={[styles.name]}>{rowData.name}</Text>
                        <Text style={styles.phone}>{rowData.phone}</Text>
                    </View>
                    <TouchableOpacity style={styles.deleteWrapper} onPress={() => this._deleteItem(rowData.id)}>
                        <Icon name='md-remove-circle' style={styles.deleteIcon}/>
                    </TouchableOpacity>
                </View>
            </DynamicListRow>
        );
    }

    _addItemPressed() {

        AlertIOS.prompt(
            'Add Item',
            'Name here:',
            [
                {
                    text    : 'OK',
                    onPress : (name) => {
                        this._addItem(name);
                    }
                }
            ],
            'plain-text',
            ''
        );
    }

    _addItem(name) {
        this._data.push({
            id    : md5(name + Math.random()),
            name  : name,
            phone : 'XX-XXX-XXX-XXXX'
        });
        this.setState({
            rowToDelete : -1,
            dataSource  : this.state.dataSource.cloneWithRows(this._data)
        });
    }

    componentWillUpdate(nexProps, nexState) {
        if (nexState.rowToDelete !== null) {
            this._data = this._data.filter((item) => {
                if (item.id !== nexState.rowToDelete) {
                    return item;
                }
            });
        }
    }

    _deleteItem(id) {
        this.setState({
            rowToDelete : id
        });
    }

    _onAfterRemovingElement() {
        this.setState({
            rowToDelete : null,
            dataSource  : this.state.dataSource.cloneWithRows(this._data)
        });
    }

}

const styles = StyleSheet.create({
    container : {
        flex            : 1,
        backgroundColor : '#fff'
    },
    noData    : {
        color     : '#000',
        fontSize  : 18,
        alignSelf : 'center',
        top       : 200
    },

    addPanel      : {
        paddingTop      : 40,
        paddingBottom   : 20,
        backgroundColor : '#F9F9F9'
    },
    addButton     : {
        backgroundColor : '#0A5498',
        width           : 120,
        alignSelf       : 'flex-end',
        marginRight     : 10,
        padding         : 5,
        borderRadius    : 5
    },
    addButtonText : {
        color     : '#fff',
        alignSelf : 'center'
    },

    rowStyle : {
        backgroundColor   : '#FFF',
        paddingVertical   : 5,
        paddingHorizontal : 10,
        borderBottomColor : '#ccc',
        borderBottomWidth : 1,
        flexDirection     : 'row'
    },

    rowIcon : {
        width            : 30,
        alignSelf        : 'flex-start',
        marginHorizontal : 10,
        fontSize         : 24
    },

    name    : {
        color    : '#212121',
        fontSize : 14
    },
    phone   : {
        color    : '#212121',
        fontSize : 10
    },
    contact : {
        width     : window.width - 100,
        alignSelf : 'flex-start'
    },

    dateText      : {
        fontSize         : 10,
        color            : '#ccc',
        marginHorizontal : 10
    },
    deleteWrapper : {
        paddingVertical : 10,
        width           : 80,
        alignSelf       : 'flex-end'
    },
    deleteIcon    : {
        fontSize  : 24,
        color     : '#DA281C',
        alignSelf : 'center'
    }
});
