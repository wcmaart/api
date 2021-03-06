const fs = require('fs')
const path = require('path')

const rootDir = path.join(__dirname, '../../..')

/** Class representing the config settings. */
class Config {
  /**
   * This will load in all the config details.
   */
  constructor () {
    //  Read in the config details from the file system
    const configFile = path.join(rootDir, 'config.json')
    if (!fs.existsSync(configFile)) {
      const crypto = require('crypto')
      const handshake = crypto
        .createHash('md5')
        .update(`${Math.random()}`)
        .digest('hex')
      this.set('handshake', handshake)
    }

    //  Read in the config file
    const configRaw = fs.readFileSync(configFile, 'utf-8')
    const configJSON = JSON.parse(configRaw)
    Object.assign(this, configJSON)
  }

  /**
   * This is our getter that allows us to get values from the config.
   * @param {string} key The key we want to look up in the config, this may be a top
   * level item or node, or a nested item such as 'level1.level2.level3'
   * representation of a user.
   * @returns {string|int|Array|json} Returns the value, matching the item we are looking for
   * which may be in the format of a string, numerical, array, json and so on.
   */
  get (key) {
    //  Turn it all into an array so we can step through it.
    //  This is a slightly annoying way of moving through a set
    //  nodes on a JSON object. But I find this the most readable
    //  even though it's still messy. We are basically going to
    //  turn the item we are looking for into an array and then
    //  break off the first item over and over using it to
    //  step through the JSON object.
    const nodePath = key.split('.')
    //  Grab the first node to look for
    let nextNode = nodePath.shift()
    //  Assume we have a match until we don't
    let foundMatch = true
    //  Start at the config object
    let lookingAtNode = this

    //  Don't both digging in if we only have the top
    //  level thing to check
    if (nodePath.length === 0 && !(nextNode in lookingAtNode)) {
      foundMatch = false
    }

    //  While we _haven't_ yet failed and we have more to go...
    while (foundMatch === true && nodePath.length > 0) {
      //  If the next node we are looking for isn't there, then we are done
      if (!(nextNode in lookingAtNode)) {
        foundMatch = false
      } else {
        //  If we do find it, the shift deeper into the JSON by looking
        //  at the next node down
        lookingAtNode = lookingAtNode[nextNode]
        //  Then pop the next one off the stack. NOTE: we know that if we
        //  remove the last item and the array becomes empty then this won't
        //  run again, that's ok, it's not an error. We'll look at the last
        //  node after the loop.
        nextNode = nodePath.shift()
      }
    }
    //  If we got here then we got all the way down to the last item
    //  so here we actually grab the value.
    if (foundMatch) {
      return lookingAtNode[nextNode]
    }
    //  If we didn't return a value above, then return null
    return null
  }

  /**
   * This is the setter that allows us to set values on the config file. It will
   * also automatically save it
   * @param {string} key This is the node path you want to set the value on, can be
   * a single top level node, i.e. 'alpha' or a full path 'alpha.beta.gamma'
   * @param {string|number|Array|object} value The value we want to set
   */
  set (key, value) {
    //  This is easier than the above code, we basically walk down
    //  the node path, creating the nodes if we need to.
    const keyPath = key.split('.')
    let thisNode = keyPath.shift()
    let rootNode = this
    while (keyPath.length > 0) {
      if (!(thisNode in rootNode)) {
        rootNode[thisNode] = {}
      }
      rootNode = rootNode[thisNode]
      thisNode = keyPath.shift()
    }
    //  Then pop the final value in
    rootNode[thisNode] = value

    //  Now save the config file
    this.save()
  }

  save () {
    const configFile = path.join(rootDir, 'config.json')
    const configJSONPretty = JSON.stringify(this, null, 4)
    fs.writeFileSync(configFile, configJSONPretty, 'utf-8')
  }
}
module.exports = Config
