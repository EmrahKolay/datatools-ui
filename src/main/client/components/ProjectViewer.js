import React from 'react'

import { Grid, Row, Col, Button, Table, Input, Panel, Glyphicon, Badge, DropdownButton, MenuItem, ButtonInput, form } from 'react-bootstrap'
import { Link } from 'react-router'

import ManagerPage from '../components/ManagerPage'
import EditableTextField from './EditableTextField'

import { defaultSorter, retrievalMethodString } from '../util/util'

export default class ProjectsList extends React.Component {

  constructor (props) {
    super(props)
  }

  deleteFeedSource (feedSource) {
    this.refs['page'].showConfirmModal({
      title: 'Delete Feed Source?',
      body: `Are you sure you want to delete the feed source ${feedSource.name}?`,
      onConfirm: () => {
        console.log('OK, deleting')
        this.props.deleteFeedSourceConfirmed(feedSource)
      }
    })
  }
  componentWillMount () {
    this.props.onComponentMount(this.props)
  }

  render () {

    if(!this.props.project) {
      return <ManagerPage />
    }

    const filteredFeedSources = this.props.project.feedSources
      ? this.props.project.feedSources.filter(feedSource => {
          if(feedSource.isCreating) return true // feeds actively being created are always visible
          return feedSource.name !== null ? feedSource.name.toLowerCase().indexOf((this.props.visibilitySearchText || '').toLowerCase()) !== -1 : '[unnamed project]'
        }).sort(defaultSorter)
      : []

    return (
      <ManagerPage ref='page'>
        <Grid>
          <Row>
            <Col xs={12}>
              <ul className='breadcrumb'>
                <li><Link to='/'>Projects</Link></li>
                <li className='active'>{this.props.project.name}</li>
              </ul>
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              <h2>{this.props.project.name}</h2>
            </Col>
          </Row>

          <Panel
            header={(<b>Project Settings</b>)}
            collapsible
          >
            <Row>
              <Col xs={12}>
                <form>
                  <Input
                    type="text"
                    defaultValue={this.props.project.defaultLocationLat !== null &&  this.props.project.defaultLocationLon !== null ? 
                      `${this.props.project.defaultLocationLat},${this.props.project.defaultLocationLon}` :
                      ''}
                    placeholder="34.8977,-87.29987"
                    label="Default location (lat, lng)"
                    ref="defaultLocation"
                    onChange={(evt) => {
                      const latLng = evt.target.value.split(',')
                      console.log(latLng)
                      if (typeof latLng[0] !== 'undefined' && typeof latLng[1] !== 'undefined')
                        this.setState({defaultLocationLat: latLng[0], defaultLocationLon: latLng[1]})
                      else
                        console.log('invalid value for latlng')
                    }} 
                  />
                  <Input
                    type="text"
                    defaultValue={this.props.project.north !== null ? `${this.props.project.west},${this.props.project.south},${this.props.project.east},${this.props.project.north}` : ''}
                    placeholder="-88.45,33.22,-87.12,34.89"
                    label="Bounding box (west, south, east, north)"
                    ref="boundingBox"
                    onChange={(evt) => {
                      const bBox = evt.target.value.split(',')
                      if (bBox.length === 4)
                        this.setState({west: bBox[0], south: bBox[1], east: bBox[2], north: bBox[3]})
                    }} 
                  />
                  <ButtonInput
                    bsStyle="primary"
                    type="submit"
                    onClick={(evt) => {
                      evt.preventDefault()
                      console.log(this.state)
                      console.log(this.props.project)
                      this.props.updateProjectSettings(this.props.project, this.state)
                    }}
                  >
                    Save
                  </ButtonInput>
                </form>
              </Col>
            </Row>
          </Panel>

          <Panel
            header={(<b>Feed Sources</b>)}
            collapsible
            defaultExpanded={true}
          >
            <Row>
              <Col xs={4}>
                <Input
                  type="text"
                  placeholder="Search by Feed Source Name"
                  onChange={evt => this.props.searchTextChanged(evt.target.value)}
                />
              </Col>
              <Col xs={8}>
                <Button
                  bsStyle="primary"
                  id='TRANSITLAND'
                  onClick={(evt) => {
                    this.props.thirdPartySync("TRANSITLAND")
                  }}
                >
                  <Glyphicon glyph='refresh' /> transit.land
                </Button>
                <Button
                  bsStyle="primary"
                  id='TRANSITFEEDS'
                  onClick={(evt) => {
                    this.props.thirdPartySync("TRANSITFEEDS")
                  }}
                >
                  <Glyphicon glyph='refresh' /> transitfeeds.com
                </Button>
                <Button
                  bsStyle='primary'
                  id='MTC'
                  onClick={(evt) => {
                    this.props.thirdPartySync("MTC")
                  }}
                >
                  <Glyphicon glyph='refresh' /> MTC
                </Button>
                <Button
                  bsStyle='default'
                  onClick={() => {
                    console.log(this.props.project)
                    this.props.updateAllFeeds(this.props.project)
                  }}
                >
                  <Glyphicon glyph='refresh' /> Update all feeds
                </Button>
                <Button
                  bsStyle='primary'
                  className="pull-right"
                  onClick={() => this.props.onNewFeedSourceClick()}
                >
                  New Feed Source
                </Button>
              </Col>
            </Row>
            <Row>
              <Col xs={12}>
                <Table striped hover>
                  <thead>
                    <tr>
                      <th className='col-md-4'>Name</th>
                      <th>Public?</th>
                      <th>Retrieval Method</th>
                      <th>Last Updated</th>
                      <th>Error<br/>Count</th>
                      <th>Valid Range</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeedSources.map((feedSource) => {
                      return <FeedSourceTableRow
                        feedSource={feedSource}
                        key={feedSource.id}
                        newFeedSourceNamed={this.props.newFeedSourceNamed}
                        feedSourcePropertyChanged={this.props.feedSourcePropertyChanged}
                        deleteFeedSourceClicked={() => this.deleteFeedSource(feedSource)}
                      />
                    })}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Panel>
        </Grid>
      </ManagerPage>
    )
  }
}

class FeedSourceTableRow extends React.Component {

  constructor (props) {
    super(props)
  }

  render () {
    const fs = this.props.feedSource
    return (
      <tr key={fs.id}>
        <td className="col-md-4">
          <div>
            <EditableTextField
              isEditing={(fs.isCreating === true)}
              value={fs.name}
              onChange={(value) => {
                if(fs.isCreating) this.props.newFeedSourceNamed(value)
                else this.props.feedSourcePropertyChanged(fs, 'name', value)
              }}
              link={`/feed/${fs.id}`}
            />
          </div>
        </td>
        <td></td>
        <td>
          <Badge>{retrievalMethodString(fs.retrievalMethod)}</Badge>
        </td>
        <td></td>
        <td></td>
        <td></td>
        <td>
          <Button
            bsStyle='danger'
            bsSize='small'
            className='pull-right'
            onClick={this.props.deleteFeedSourceClicked}
          >
            <Glyphicon glyph='remove' />
          </Button>
        </td>
      </tr>
    )
  }
}
